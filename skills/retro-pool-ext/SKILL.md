---
name: retro-pool-ext
description: Extension of the retro skill. Reads the gathered entries of the Retro pool, records the dev's judgement, and records the accepted changes in the pool. Runs at the retro protocol's read, present and change steps; never alone.
---

# retro-pool-ext

Adds to `retro`. Removes none of its steps. The pool's place and format are in `agent-rules/retro-pool.md` of the pinned copy.

## Read

Read the entries of the gathering's commit in one Bash call:

```
cd <pool> && git show --format= --name-only <commit> | grep -v '^index.md$' | xargs cat
```

## Present

When the dev judges, record each judgement with the Edit tool on the entry's `State` line and on its index row, in the state the format's Judgement section gives it. An accepted fix gets `in work`.

## Change

1. For each entry in `in work`, count the tokens of each file its fix changes, by the format's Tokens section.
2. Make the fix. Count the tokens of the same files again.
3. Rewrite each judged entry whole with the Write tool, compact by the format's Judgement section. A fix's entry gets its `Tokens:` line and state `fixed`, and its index row gets the same state.
4. Commit in the pool with the message `Judge <session id>`.
