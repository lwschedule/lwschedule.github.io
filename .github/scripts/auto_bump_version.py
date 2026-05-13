#!/usr/bin/env python3
import re
import sys
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parents[2]
README = ROOT / 'README.md'
SW = ROOT / 'sw.js'
INFO = ROOT / 'info' / 'index.html'

def format_date(dt: datetime) -> str:
    # Format like: May 11, 2026
    return f"{dt.strftime('%B')} {dt.day}, {dt.year}"

def bump_version(version_text: str, prev_version_text: str = None) -> str:
    """Bump version. Skip bumping if major or minor was manually changed."""
    parts = version_text.lstrip('v').split('.')
    if not parts[0].isdigit():
        return version_text

    major = int(parts[0])
    minor = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 0
    patch = int(parts[2]) if len(parts) > 2 and parts[2].isdigit() else 0

    # If there's a previous version, check if major or minor was changed
    if prev_version_text:
        prev_parts = prev_version_text.lstrip('v').split('.')
        prev_major = int(prev_parts[0]) if prev_parts[0].isdigit() else 0
        prev_minor = int(prev_parts[1]) if len(prev_parts) > 1 and prev_parts[1].isdigit() else 0

        # If major or minor was manually changed, don't bump
        if major != prev_major or minor != prev_minor:
            return version_text

    # Otherwise, bump patch (respecting the format)
    original_parts_count = len(parts)
    if original_parts_count == 1:
        # v1 -> v2
        major += 1
        return f"v{major}"
    elif original_parts_count == 2:
        # v1.2 -> v1.3
        minor += 1
        return f"v{major}.{minor}"
    else:
        # v1.2.3 -> v1.2.4 (default)
        patch += 1
        return f"v{major}.{minor}.{patch}"

def bump_readme_version_and_date():
    import subprocess
    text = README.read_text(encoding='utf-8')
    # Find Current Version: `vX`, `vX.Y`, `vX.Y.Z`, or the same values without the leading `v`
    ver_re = re.compile(r"(\*\*Current Version:\*\*\s*`)(v?\d+(?:\.\d+){0,2})(`)", re.IGNORECASE)
    m = ver_re.search(text)
    changed = False
    if m:
        prefix, current_version, suffix = m.group(1), m.group(2), m.group(3)
        
        # Get the staged version (in the index) to check if we already bumped it
        try:
            staged_text = subprocess.check_output(['git', 'show', ':README.md'], text=True, cwd=ROOT, stderr=subprocess.DEVNULL)
            staged_match = ver_re.search(staged_text)
            if staged_match and staged_match.group(2) == current_version:
                # Version in working tree matches staged version - we already bumped it, skip
                return False
        except:
            pass
        
        # Get the previous version from git HEAD
        prev_version = None
        try:
            prev_text = subprocess.check_output(['git', 'show', 'HEAD:README.md'], text=True, cwd=ROOT, stderr=subprocess.DEVNULL)
            prev_match = ver_re.search(prev_text)
            if prev_match:
                prev_version = prev_match.group(2)
        except:
            pass
        
        new_ver = bump_version(current_version, prev_version)
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

def update_info_page(version_text: str, release_date_text: str):
    if not INFO.exists():
        return False

    text = INFO.read_text(encoding='utf-8')
    changed = False

    version_re = re.compile(r"(<div class=\"versionBadge\">Version\s+)([^<]+)(</div>)")
    if version_re.search(text):
        text = version_re.sub(lambda m: f"{m.group(1)}{version_text.lstrip('v')}{m.group(3)}", text, count=1)
        changed = True

    released_re = re.compile(r"(<p>Released\s+)([^<]+)(</p>)")
    if released_re.search(text):
        text = released_re.sub(lambda m: f"{m.group(1)}{release_date_text}{m.group(3)}", text, count=1)
        changed = True

    if changed:
        INFO.write_text(text, encoding='utf-8')
    return changed

def main():
    changed_readme = bump_readme_version_and_date()
    changed_sw = update_sw_cache_name()
    # Re-read the README to extract the final current version and date for info pages.
    readme_text = README.read_text(encoding='utf-8')
    version_match = re.search(r"\*\*Current Version:\*\*\s*`(v?\d+(?:\.\d+){0,2})`", readme_text, re.IGNORECASE)
    date_match = re.search(r"\*\*Release Date:\*\*\s*`([^`]*)`", readme_text)
    final_version = version_match.group(1) if version_match else 'v0.0.0'
    final_release_date = date_match.group(1) if date_match else format_date(datetime.now())
    changed_info = update_info_page(final_version, final_release_date)
    files_changed = []
    if changed_readme:
        files_changed.append(str(README.relative_to(ROOT)))
    if changed_sw:
        files_changed.append(str(SW.relative_to(ROOT)))
    if changed_info:
        files_changed.append(str(INFO.relative_to(ROOT)))

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
