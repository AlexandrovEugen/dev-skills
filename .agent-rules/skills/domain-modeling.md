<!-- managed by dev-skills: agent-rules/skill-protocols/domain-modeling.md -->

# Domain-modeling protocol

Use this file only with an invoked domain-modeling skill.

- Put a resolved term in the relevant `GLOSSARY.md` in the same turn; where none exists, the skill's rule for creating files lazily decides.
- Name a conflict with a glossary term or its avoid-list in the turn it appears.
- Define a glossary term by its meaning, without implementation detail.
- Offer an ADR only when the skill's three conditions hold, and write it when the dev accepts.
