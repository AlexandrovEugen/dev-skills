#!/usr/bin/env bash
set -euo pipefail
exec python3 -I - "$@" <<'PY'
import re
import sys

ENTRY = re.compile(r"^\*\*(.+?)\*\*:\n((?:(?!_Avoid_)[^\n*][^\n]*\n)+)(_Avoid_:[^\n]*\n(?:[^\n*][^\n]*\n)*)?", re.M)
EXAMPLE = re.compile(r"\b(such as|e\.g\.|for example|for instance)", re.I)
failed = False
for path in sys.argv[1:]:
    text = open(path, encoding="utf-8").read()
    for match in ENTRY.finditer(text):
        term = match.group(1)
        definition = " ".join(match.group(2).split())
        avoid = " ".join((match.group(3) or "").split()).removeprefix("_Avoid_:").strip()
        if EXAMPLE.search(definition):
            print(f"{path}: {term}: the definition carries an example")
            failed = True
        if avoid and len(avoid) >= len(definition):
            print(f"{path}: {term}: the _Avoid_ line is not shorter than the definition")
            failed = True
sys.exit(1 if failed else 0)
PY
