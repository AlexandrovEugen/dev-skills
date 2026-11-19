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
- `fixed`: the fix is in place, or the dev accepted the good practice; new occurrences are still appended and compared.
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

Append occurrences, one line each, until the dev judges the entry. A `fixed` entry also gets a line with `Count: 0` from each session that ran its step or rule without the problem: that line is a counted run.

## Verdict

The verdict compares the count of this run's occurrence with the count of the occurrence before it, as raw numbers. Fewer is `better`, more is `worse`, equal is `same`; 0 after a count above 0 is `better`. An entry with one occurrence has `none yet`.

## Tokens

Count the tokens of a text as its bytes divided by 4, rounded up, the rule of `agent-rules/tools/token-limit-check.sh`. Get the bytes with `wc -c`. A fix's `Tokens:` line holds the count of each file it changes, before and after the change.

## Judgement

Only a retro judges entries, and only on the dev's word.

- A judged entry is rewritten whole to its current state, compact: What, Handling, Fix and Verdict as they now stand, and only its last three occurrence lines. The pool's git keeps the full history.
- A fix the dev accepts sets its entry to `in work`; the retro sets `fixed` once the fix is in place.
- A fixed problem whose last three occurrences each have `Count: 0` graduates: the retro proposes it as a good practice.
- A good practice enters the pool's judged set only through the judge: when the dev calls it, the retro proposes each graduated problem and each `gathering` good-practice entry. The dev accepts or rejects each one. An accepted one gets kind `good practice` and state `fixed`; a rejected one gets state `closed`.
