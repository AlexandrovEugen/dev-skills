#!/usr/bin/env bash
set -euo pipefail

max_tokens=5000
bytes_per_token=4
max_bytes=$((max_tokens * bytes_per_token))

named_as_not_agent_authored() {
  case "${1##*/}" in
    package-lock.json | npm-shrinkwrap.json | yarn.lock | pnpm-lock.yaml | bun.lock | bun.lockb \
      | poetry.lock | uv.lock | Pipfile.lock | pdm.lock | Cargo.lock | Gemfile.lock | composer.lock \
      | go.sum | flake.lock | mix.lock | pubspec.lock | Podfile.lock | packages.lock.json \
      | gradle.lockfile | *.lock | *-lock.json | *-lock.yaml | *.lockfile)
      return 0 ;;
    *.min.js | *.min.css | *.map | *.pb.go | *_pb2.py | *_pb2.pyi | *.g.dart | *.generated.*)
      return 0 ;;
    *.csv | *.tsv | *.jsonl | *.ndjson | *.parquet)
      return 0 ;;
  esac
  case "/$1" in
    */fixtures/* | */golden/* | */snapshots/* | */__snapshots__/* | */vendor/* | */node_modules/*)
      return 0 ;;
  esac
  return 1
}

marked_generated() {
  local attributes
  attributes="$(git check-attr --cached linguist-generated linguist-vendored -- "$1")"
  grep -qE ': (set|true)$' <<<"$attributes"
}

has_generated_header() {
  local header
  header="$(git cat-file blob ":0:$1" 2>/dev/null | head -c 2048 | head -n 5 || true)"
  grep -qiE '@generated|do not edit|code generated|auto-?generated' <<<"$header"
}

offenders=""
count=0
while IFS=$'\t' read -r -d '' added _ path; do
  [ "$added" != "-" ] || continue
  named_as_not_agent_authored "$path" && continue
  bytes="$(git cat-file -s ":0:$path" 2>/dev/null)" || continue
  [ "$bytes" -gt "$max_bytes" ] || continue
  marked_generated "$path" && continue
  has_generated_header "$path" && continue
  tokens=$(((bytes + bytes_per_token - 1) / bytes_per_token))
  parts=$(((bytes + max_bytes - 1) / max_bytes))
  offenders+="$(printf '  %s\n    %d tokens (%d bytes): cut at least %d tokens, into %d files or more' \
    "$path" "$tokens" "$bytes" "$((tokens - max_tokens))" "$parts")"$'\n'
  count=$((count + 1))
done < <(git diff --cached --numstat --no-renames -z --diff-filter=ACMT)

[ "$count" -eq 0 ] && exit 0

cat >&2 <<EOF
Commit blocked: $count staged file(s) are over the $max_tokens-token limit.
Tokens are bytes / $bytes_per_token, so a file holds at most $max_bytes bytes.

$offenders
The check reads each file as it is staged. A file that is already over the limit blocks
every commit that stages it, a one-line edit included.

Split each file before you commit it:

1. Move code, never rewrite it. A split changes where code lives, not what it does, and
   the tests that passed before the split pass after it unchanged.

2. Find the seams. List the file's top-level units and the line where each one starts:
     Python module:  grep -nE '^(class|def|async def) ' <file>
     Python class:   grep -nE '^    (async )?def ' <file>
     Markdown:       grep -nE '^#{1,2} ' <file>
     TS / JS:        grep -nE '^export ' <file>
   Each new file takes whole units. Units that call each other stay together.

3. Python source: each class gets its own package, <package>/<class_name>/core.py, with an
   __init__.py that re-exports it (from .core import ClassName). Its constants go to
   constants.py and its internal logic to helpers.py, beside core.py. Update every import of
   the moved class.

4. A class that is still over the limit hands part of its work to a new class. Take a group
   of methods that serve one purpose, move them to a class in its own package, and inject
   that class through __init__.

5. Python tests: one test module per class, at tests/<the class's path>/test_core.py. Move a
   large given block into helpers.py in the same test package, one function per
   participant. Replace near-copies of one test with @pytest.mark.parametrize.

6. TypeScript, JavaScript and shell: one module per responsibility. The original file keeps
   only the entry point or the re-exports of the new modules, so its importers still work.

7. Markdown: split at the top-level ## headings into a directory named after the file
   (docs/foo.md becomes docs/foo/<section>.md). The original path keeps a short index that
   links every part, so existing links still resolve.

8. Check each part: wc -c <file> prints at most $max_bytes. Stage the new files and the
   shortened original with git add, then commit again.

Never bypass this check with git commit --no-verify.
EOF
exit 1
