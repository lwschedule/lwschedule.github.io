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


def bump_version(version_text: str) -> str:
    """Increment the last numeric component of a version string.

    Supports 1-4 component versions: v3, v3.7, v3.7.1, v3.7.1.2.
    Always increments the last component by one.
    """
    parts = version_text.lstrip('v').split('.')
    if not parts or not parts[0].isdigit():
        return version_text

    nums = []
    for p in parts:
        if p.isdigit():
            nums.append(int(p))
        else:
            break
    if not nums:
        return version_text

    # A 2-component version (x.y) is a minor release shorthand.
    # Append .1 instead of incrementing the minor: v3.7 -> v3.7.1
    if len(nums) == 2:
        nums.append(1)
    else:
        nums[-1] += 1
    return 'v' + '.'.join(str(n) for n in nums)


def bump_readme_version_and_date():
    text = README.read_text(encoding='utf-8')
    ver_re = re.compile(r"(\*\*Current Version:\*\*\s*`)(v?\d+(?:\.\d+){0,3})(`)", re.IGNORECASE)
    m = ver_re.search(text)
    changed = False
    if m:
        prefix, current_version, suffix = m.group(1), m.group(2), m.group(3)
        new_ver = bump_version(current_version)
        text = ver_re.sub(f"{prefix}{new_ver}{suffix}", text, count=1)
        changed = True

    now = datetime.now()
    date_str = format_date(now)
    date_re = re.compile(r"(\*\*Release Date:\*\*\s*`)([^`]*)`")
    if date_re.search(text):
        text = date_re.sub(rf"\1{date_str}`", text, count=1)
        changed = True

    if changed:
        README.write_text(text, encoding='utf-8')
    return changed


def update_sw_cache_name():
    text = SW.read_text(encoding='utf-8')
    now = datetime.now()
    iso_date = now.strftime('%Y-%m-%d')
    cache_re = re.compile(r"const\s+CACHE_NAME\s*=\s*['\"].*?['\"];")
    new_cache = f"const CACHE_NAME = 'lwschedule-{iso_date}';"
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

    changed_readme = bump_readme_version_and_date()
    changed_sw = update_sw_cache_name()

    # Re-read README to get the final bumped version and date.
    readme_text = README.read_text(encoding='utf-8')
    version_match = re.search(r"\*\*Current Version:\*\*\s*`(v?\d+(?:\.\d+){0,3})`", readme_text, re.IGNORECASE)
    date_match = re.search(r"\*\*Release Date:\*\*\s*`([^`]*)`", readme_text)
    final_version = version_match.group(1) if version_match else 'v0.0.0'
    final_release_date = date_match.group(1) if date_match else format_date(datetime.now())

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
