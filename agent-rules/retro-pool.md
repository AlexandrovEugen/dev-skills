# Retro pool format

The Retro pool holds every problem and good practice gathered from sessions, one entry each. This file is its format. The pool's data lives only in the pool, never in a repository.

## Place

Compute the pool's place from the workspace path each time you need it:

1. When `<workspace-path>/.claude/settings.local.json` sets `env.RETRO_POOL`, the pool is that folder.
2. Otherwise the pool is `retro-pool` in the parent folder of `realpath <workspace-path>`.

Write the place into no file except that personal setting.

## Layout

The pool is its own local git repository with no remote. It holds:

- `index.md`: one line per entry.
- `<id>-<slug>.md`: one entry, where `<id>` is the next free four-digit number and `<slug>` is the title in lower-case kebab case.

Commit every change in the pool, in the pool's git.

## Index

An empty index is exactly these two lines:

```markdown
| id | title | kind | state |
|----|-------|------|-------|
```

Each entry adds one row, in id order: `| 0001 | <title> | <kind> | <state> |`. Kind is `problem` or `good practice`.

## States

- `gathering`: occurrences are appended; nobody has judged the entry yet.
- `in work`: the dev accepted a fix that is not yet in place.
- `fixed`: the fix is in place; new occurrences are still appended and compared.
- `closed`: done for good. Leave closed entries unread; read every other entry when matching.

The index row and the entry's `State` line always hold the same state.

## Entry

```markdown
# <id> <title>

Kind: <problem | good practice>
State: <gathering | in work | fixed | closed>

## What

<The problem, or the good practice, in one or two sentences.>

## Handling

<For a problem: why it happens and how it is handled. For a good practice: how it is kept.>

## Occurrences

- Session: <session id>. When: <YYYY-MM-DD>. Count: <n>. How: <what happened>. Why: <cause>. Step or rule: <the step or rule it broke or kept, or "no rule">.

## Fix

<The current fix: the file and the text it changes, or "none".>
Tokens: <count before> before, <count after> after.

## Verdict

<better | worse | same | none yet>: count <this run> against <previous occurrence>.
```

Append occurrences, one line each, until the dev judges the entry. At judgement, rewrite the entry to its current state; the pool's git keeps the full history.

The verdict compares this run's count with the previous occurrence's count: fewer is better, more is worse, equal is the same. A fixed problem with a count of 0 in 3 counted runs becomes a good practice.
