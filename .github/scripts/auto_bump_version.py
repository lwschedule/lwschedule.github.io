#!/usr/bin/env python3
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parents[2]
README = ROOT / 'README.md'
SW = ROOT / 'sw.js'
CHANGELOG = ROOT / 'data' / 'changelog.json'


def format_date(dt: datetime) -> str:
    """Format like: July 7, 2026"""
    return f"{dt.strftime('%B')} {dt.day}, {dt.year}"


def next_version(current_version: str, today: datetime) -> str:
    """Compute the next date-based version.

    Format: vYYYY.M.D, or vYYYY.M.D.N when there are multiple releases
    in one day (N = release count that day, so the second release is .2).
    If the current version is already dated today, increment its release
    count; otherwise start fresh with today's date.
    """
    m = re.match(r'^v(\d{4})\.(\d+)\.(\d+)(?:\.(\d+))?$', current_version)
    today_ver = f'v{today.year}.{today.month}.{today.day}'
    if not m:
        return today_ver
    cur_date = f'v{int(m.group(1))}.{int(m.group(2))}.{int(m.group(3))}'
    if cur_date == today_ver:
        n = int(m.group(4)) if m.group(4) else 1
        return f'{today_ver}.{n + 1}'
    return today_ver


def bump_readme_version():
    text = README.read_text(encoding='utf-8')
    ver_re = re.compile(r"(\*\*Current Version:\*\*\s*`)(v?\d+(?:\.\d+){0,3})(`)", re.IGNORECASE)
    m = ver_re.search(text)
    if not m:
        return False
    prefix, current_version, suffix = m.group(1), m.group(2), m.group(3)
    new_ver = next_version(current_version, datetime.now())
    text = ver_re.sub(f"{prefix}{new_ver}{suffix}", text, count=1)
    README.write_text(text, encoding='utf-8')
    return True


def update_sw_cache_name(version: str) -> bool:
    """Set CACHE_NAME from the release version so it is unique for every release."""
    text = SW.read_text(encoding='utf-8')
    cache_re = re.compile(r"const\s+CACHE_NAME\s*=\s*['\"].*?['\"];")
    new_cache = f"const CACHE_NAME = 'lwschedule-{version.lstrip('v')}';"
    if cache_re.search(text):
        text = cache_re.sub(new_cache, text, count=1)
        SW.write_text(text, encoding='utf-8')
        return True
    return False


def get_commit_title() -> str:
    """Read the most recent commit's subject line (only valid in post-commit)."""
    try:
        result = subprocess.run(
            ['git', 'log', '-1', '--format=%s'],
            capture_output=True, text=True, check=True, cwd=str(ROOT)
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError:
        return 'Internal Changes'


def prepend_changelog_entry(version: str, title: str, date: str) -> bool:
    """Prepend a new entry to the changelog JSON file."""
    try:
        if CHANGELOG.exists():
            entries = json.loads(CHANGELOG.read_text(encoding='utf-8'))
        else:
            entries = []
    except (json.JSONDecodeError, FileNotFoundError):
        entries = []

    # Strip any version prefix from the title (e.g. "v3.7.12: Some feature" -> "Some feature")
    prefix_match = re.match(r'^v\d+\.\d+(?:\.\d+(?:\.\d+)?)?:\s*', title)
    if prefix_match:
        title = title[prefix_match.end():]

    new_entry = {
        'version': version,
        'title': title,
        'date': date,
    }

    entries.insert(0, new_entry)
    CHANGELOG.write_text(json.dumps(entries, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'Added changelog entry: {version} - {title}')
    return True


def amend_commit(version: str):
    """Amend the most recent commit: add version prefix to subject and fold in staged files."""
    try:
        result = subprocess.run(
            ['git', 'log', '-1', '--format=%B'],
            capture_output=True, text=True, check=True, cwd=str(ROOT)
        )
    except subprocess.CalledProcessError:
        return

    full_message = result.stdout
    subject, _, rest = full_message.partition('\n')
    body = rest.strip('\r\n')

    # Strip any existing version prefix before adding the new one
    prefix_pat = re.compile(r'^v\d+\.\d+(?:\.\d+(?:\.\d+)?)?:\s*')
    clean_subject = prefix_pat.sub('', subject).strip()

    new_subject = f"{version}: {clean_subject}"
    new_message = new_subject if not body else f"{new_subject}\n\n{body}"

    tmp_path = ROOT / '.git' / 'lws_amend_msg.txt'
    try:
        tmp_path.write_text(new_message, encoding='utf-8')
        os.environ['LWS_AMEND_IN_PROGRESS'] = '1'
        subprocess.run(
            ['git', 'commit', '--amend', '--no-verify', '-F', str(tmp_path)],
            check=True, cwd=str(ROOT)
        )
        os.environ.pop('LWS_AMEND_IN_PROGRESS', None)
        print(f"Amended commit subject: {new_subject}")
    finally:
        if tmp_path.exists():
            tmp_path.unlink()


def main():
    # Guard: if this is a recursive invocation (amend triggers post-commit again), bail out.
    if os.environ.get('LWS_AMEND_IN_PROGRESS') == '1':
        return

    changed_readme = bump_readme_version()

    # Re-read README to get the final bumped version.
    readme_text = README.read_text(encoding='utf-8')
    version_match = re.search(r"\*\*Current Version:\*\*\s*`(v?\d+(?:\.\d+){0,3})`", readme_text, re.IGNORECASE)
    final_version = version_match.group(1) if version_match else 'v0.0.0'
    final_release_date = format_date(datetime.now())

    changed_sw = update_sw_cache_name(final_version)

    # In post-commit, the commit already exists, so git log -1 gives the REAL title.
    commit_title = get_commit_title()
    changed_changelog = prepend_changelog_entry(final_version, commit_title, final_release_date)

    files_changed = []
    if changed_readme:
        files_changed.append(str(README.relative_to(ROOT)))
    if changed_sw:
        files_changed.append(str(SW.relative_to(ROOT)))
    if changed_changelog:
        files_changed.append(str(CHANGELOG.relative_to(ROOT)))

    if files_changed:
        try:
            subprocess.run(['git', 'add'] + files_changed, check=True)
            print('Updated and staged:', ', '.join(files_changed))
        except Exception as e:
            print('Failed to git add files:', e, file=sys.stderr)
            sys.exit(2)

        # Amend the just-created commit: fold in staged files + add version prefix to subject.
        amend_commit(final_version)
    else:
        print('No version or cache changes necessary.')


if __name__ == '__main__':
    main()
