<!-- managed by dev-skills: agent-rules/skill-protocols/domain-modeling.md -->
---
skill: domain-modeling
with: [domain-modeling-ext]
---
# domain-modeling

1. A resolved term goes into the right `GLOSSARY.md` in the same turn, in the skill's `GLOSSARY-FORMAT.md`. With no `GLOSSARY.md`, the first resolved term creates it.
2. A word that conflicts with `GLOSSARY.md` is named in the turn it is said.
3. A `GLOSSARY.md` entry holds the meaning only, with no implementation detail.
4. An ADR is offered only when it is hard to reverse, surprising without context, and the result of a real trade-off, and is written in the skill's `ADR-FORMAT.md`.
5. Every step of `domain-modeling-ext` runs with it.
