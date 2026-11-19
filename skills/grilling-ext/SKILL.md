---
name: grilling-ext
description: Extension of the grilling skill. Adds to each round's format and to how a grill keeps its rulings. Runs together with grilling and grill-with-docs; never alone.
---

# grilling-ext

Adds to `grilling`. Removes none of its steps.

## Round format

Each question in `grilling`'s round format also has:

1. At least two options, each on its own line, labelled (a), (b), (c) in order.
2. A line that opens `Example:`, with one worked example that holds a number.
3. A line that opens `Checked:`, naming the ADRs, glossary entries, and rulings the question was tested against. A question asked before needs none.
4. A `➡️` line that opens with the recommended option's letter, `➡️ (a)`, then its reason in at least three words.
5. A question asked before is sent again word for word when nothing about it changed. When it changes, a line that opens `Rewritten:` says what changed and maps old option letters to new.

Each question is its own block, never a list item.

## Every turn of a grill

1. The grill runs from the turn `grilling` loads until the frontier is empty.
2. Each turn ends with the whole frontier in the round format, or the statement that the frontier is empty.
3. Each ADR text and `GLOSSARY.md` entry a ruling makes is shown whole, in the round that makes it.

## Rulings

1. A ruling stands until the dev withdraws it in words. A narrowing, a request for research, or an unsure answer leaves it standing.
2. A question asks only a **what**: a choice whose options each name what the user of the result sees. A **how** is solved inside the rulings, and recorded as a constraint with its source.
3. A question that the dev's words and settled rulings already answer is **derived**: state it in one line with its sources, and do not ask it.
4. Keep the design tree as a ledger file in the scratchpad: one row per ruling, constraint, and question, with its source and status. A grill that ends in its first round keeps none.
5. An answer, a rejected premise, or a widened scope is input to the next question, never consent to act.

## Check

The Stop hook `agent-rules/hooks/grill_round_check` in dev-skills blocks a turn whose round breaks this format.
