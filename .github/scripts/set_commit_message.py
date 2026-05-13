#!/usr/bin/env python3
"""
Set commit message to version number during prepare-commit-msg hook.
This is called by the prepare-commit-msg hook with the commit message file as argument.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
README = ROOT / 'README.md'

def get_current_version():
    """Extract current version from README."""
    try:
        text = README.read_text(encoding='utf-8')
        version_match = re.search(r"\*\*Current Version:\*\*\s*`(v?\d+(?:\.\d+){0,2})`", text, re.IGNORECASE)
        if version_match:
            return version_match.group(1)
    except Exception as e:
        print(f'Failed to read version: {e}', file=sys.stderr)
    return None

def set_commit_message(commit_msg_file_path):
    """Replace commit message with version number."""
    version = get_current_version()
    if not version:
        return False

    try:
        commit_msg_file = Path(commit_msg_file_path)
        commit_msg_file.write_text(version, encoding='utf-8')
        return True
    except Exception as e:
        print(f'Failed to set commit message: {e}', file=sys.stderr)
        return False

if __name__ == '__main__':
    if len(sys.argv) > 1:
        commit_msg_file = sys.argv[1]
        set_commit_message(commit_msg_file)
