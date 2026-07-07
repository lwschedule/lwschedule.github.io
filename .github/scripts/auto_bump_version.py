#!/usr/bin/env python3
import json
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
    # Format like: May 11, 2026
    return f"{dt.strftime('%B')} {dt.day}, {dt.year}"

def bump_version(version_text: str) -> str:
    """Increment the last numeric component of a version string.

    Supports 1–4 component versions: v3, v3.7, v3.7.1, v3.7.1.2.
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
    # Append .1 instead of incrementing the minor: v3.7 → v3.7.1
    if len(nums) == 2:
        nums.append(1)
    else:
        nums[-1] += 1
    return 'v' + '.'.join(str(n) for n in nums)

def bump_readme_version_and_date():
    text = README.read_text(encoding='utf-8')
    # Find Current Version: `vX`, `vX.Y`, `vX.Y.Z`, or the same values without the leading `v`
    ver_re = re.compile(r"(\*\*Current Version:\*\*\s*`)(v?\d+(?:\.\d+){0,3})(`)", re.IGNORECASE)
    m = ver_re.search(text)
    changed = False
    if m:
        prefix, current_version, suffix = m.group(1), m.group(2), m.group(3)
        new_ver = bump_version(current_version)
        text = ver_re.sub(f"{prefix}{new_ver}{suffix}", text, count=1)
        changed = True

    # Update Release Date to today
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
    # Compute date from now (date of commit/update)
    now = datetime.now()
    iso_date = now.strftime('%Y-%m-%d')
    # Replace the CACHE_NAME assignment line only
    cache_re = re.compile(r"const\s+CACHE_NAME\s*=\s*['\"].*?['\"];")
    new_cache = f"const CACHE_NAME = 'lwschedule-{iso_date}';"
    if cache_re.search(text):
        text = cache_re.sub(new_cache, text, count=1)
        SW.write_text(text, encoding='utf-8')
        return True
    return False

def get_commit_title() -> str:
    """Extract the commit title from the commit being created."""
    # Try .git/COMMIT_EDITMSG first (available during pre-commit)
    msg_path = ROOT / '.git' / 'COMMIT_EDITMSG'
    if msg_path.exists():
        first_line = msg_path.read_text(encoding='utf-8').split('\n')[0].strip()
        if first_line and not first_line.startswith('#'):
            return first_line
    # Fall back to the most recent commit
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

    # Strip version prefix from title if present
    version_prefix = f'{version}: '
    if title.startswith(version_prefix):
        title = title[len(version_prefix):]

    new_entry = {
        'version': version,
        'title': title,
        'date': date,
    }

    entries.insert(0, new_entry)
    CHANGELOG.write_text(json.dumps(entries, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'Added changelog entry: {version} - {title}')
    return True

def normalize_last_commit_subject(new_version: str) -> bool:
    """
    If the most recent commit's subject doesn't already start with `vX.Y.Z:`,
    prepend the prefix and rewrite via `git commit --amend`. Preserves the
    existing commit body and lets `git add` fold any staged files into the
    same commit. Returns True when an amend actually happened.
    """
    try:
        result = subprocess.run(
            ['git', 'log', '-1', '--format=%B'],
            capture_output=True, text=True, check=True, cwd=str(ROOT)
        )
    except subprocess.CalledProcessError:
        return False  # empty repo — nothing to amend yet

    full_message = result.stdout
    subject, _, rest = full_message.partition('\n')
    # Strip surrounding newlines/whitespace but keep inner body content intact
    body = rest.strip('\r\n')

    prefix_pat = re.compile(r'^v\d+\.\d+(?:\.\d+(?:\.\d+)?)?:\s*')
    if prefix_pat.match(subject):
        return False  # already prefixed — leave history alone

    new_subject = f"{new_version}: {subject}"
    new_message = new_subject if not body else f"{new_subject}\n\n{body}"

    tmp_path = ROOT / '.git' / 'lws_amend_msg.txt'
    try:
        tmp_path.write_text(new_message, encoding='utf-8')
        subprocess.run(
            ['git', 'commit', '--amend', '-F', str(tmp_path)],
            check=True, cwd=str(ROOT)
        )
        print(f"Rewrote last commit subject to: {new_subject}")
        return True
    finally:
        if tmp_path.exists():
            tmp_path.unlink()


def main():
    changed_readme = bump_readme_version_and_date()
    changed_sw = update_sw_cache_name()
    # Re-read the README to extract the final current version and date for info pages.
    readme_text = README.read_text(encoding='utf-8')
    version_match = re.search(r"\*\*Current Version:\*\*\s*`(v?\d+(?:\.\d+){0,3})`", readme_text, re.IGNORECASE)
    date_match = re.search(r"\*\*Release Date:\*\*\s*`([^`]*)`", readme_text)
    final_version = version_match.group(1) if version_match else 'v0.0.0'
    final_release_date = date_match.group(1) if date_match else format_date(datetime.now())
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
        # Stage files so a pre-commit hook can include them in the commit
        try:
            subprocess.run(['git', 'add'] + files_changed, check=True)
            print('Updated and staged:', ', '.join(files_changed))
        except Exception as e:
            print('Failed to git add files:', e, file=sys.stderr)
            sys.exit(2)

        # Now that the version-bump files are staged, fold them into the most
        # recent commit and rewrite its subject to begin with the new version
        # prefix — so future commits can't accidentally skip the `vX.Y.Z:`
        # convention. We only amend when something actually changed, leaving
        # history alone when the script is a no-op.
        normalize_last_commit_subject(final_version)
    else:
        print('No version or cache changes necessary.')

if __name__ == '__main__':
    main()
