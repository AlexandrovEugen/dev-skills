<!-- managed by dev-skills: agent-rules/skill-protocols/grilling.md -->
---
skill: grilling
with: [grilling-ext]
---
# grilling

1. Each round asks the whole frontier: every decision whose prerequisites are settled.
2. Each question is in the skill's round format: `❓ **Qn** - **title**: body`, then `➡️ recommendation`, separated by `---`, worded so "yes" accepts the recommendation.
3. A question that depends on another open question waits for a later round.
4. Every fact a question rests on is looked up first, by a tool or a sub-agent. A question asks the dev for a decision, never a fact.
5. Every step of `grilling-ext` runs with it.

**Ends when** the frontier is empty and the dev confirms shared understanding. Nothing is acted on before that.
