#!/usr/bin/env python3
import re
import sys
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parents[2]
README = ROOT / 'README.md'
SW = ROOT / 'sw.js'

def format_date(dt: datetime) -> str:
    # Format like: May 11, 2026
    return f"{dt.strftime('%B')} {dt.day}, {dt.year}"

def bump_version(version_text: str) -> str:
    parts = version_text.lstrip('v').split('.')
    if not parts[0].isdigit():
        return version_text

    major = int(parts[0])
    minor = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 0
    patch = int(parts[2]) if len(parts) > 2 and parts[2].isdigit() else 0

    return f"v{major}.{minor}.{patch + 1}"

def bump_readme_version_and_date():
    text = README.read_text(encoding='utf-8')
    # Find Current Version: `vX`, `vX.Y`, `vX.Y.Z`, or the same values without the leading `v`
    ver_re = re.compile(r"(\*\*Current Version:\*\*\s*`)(v?\d+(?:\.\d+){0,2})(`)", re.IGNORECASE)
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

def main():
    changed_readme = bump_readme_version_and_date()
    changed_sw = update_sw_cache_name()
    files_changed = []
    if changed_readme:
        files_changed.append(str(README.relative_to(ROOT)))
    if changed_sw:
        files_changed.append(str(SW.relative_to(ROOT)))

    if files_changed:
        # Stage files so a pre-commit hook can include them in the commit
        try:
            import subprocess
            subprocess.run(['git', 'add'] + files_changed, check=True)
            print('Updated and staged:', ', '.join(files_changed))
        except Exception as e:
            print('Failed to git add files:', e, file=sys.stderr)
            sys.exit(2)
    else:
        print('No version or cache changes necessary.')

if __name__ == '__main__':
    main()
