---
name: domain-modeling-ext
description: Extension of the domain-modeling skill. Adds rules for GLOSSARY.md entries and ADRs. Runs together with domain-modeling and grill-with-docs; never alone.
---

# domain-modeling-ext

Adds to `domain-modeling`. Removes none of its steps.

## Glossary entries

1. An entry is one short definition with no example and no named instance. Its `_Avoid_` line may show what the term is not.
2. An entry defines its term only by terms defined above it.
3. The `_Avoid_` line is shorter than the definition.
4. A term the glossary lacks gets an entry only when the dev names it. Until then, use the code's name or plain English.
5. After editing a `GLOSSARY.md`, run `glossary-check.sh <that file>` from this skill's folder, and fix each finding in an entry you touched.

## ADRs

1. An ADR is final once merged into the default branch. Never edit it after that.
2. A changed decision gets a new ADR at the next free number. Its header names each decision it supersedes and each that still stands.
3. In the ADR index, edit only the Status column and append the new row.
4. Each decision an ADR records is **ruled**, naming the dev's words, or **derived**, naming the words and settled decisions it follows from. A choice of the agent's own goes into the ticket as a constraint, never into an ADR.
5. When the dev contradicts an ADR in a grill, the grill's new ADR supersedes it, with no question to the dev.
