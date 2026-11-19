<!-- managed by dev-skills: agent-rules/skill-protocols/research.md -->
---
skill: research
kind: side-quest
---
# research

1. The first tool call starts one background agent with a fresh context and the question.
2. Each finding cites the primary source that owns it, in one Markdown file where the repository keeps such notes.
3. The stage's protocols stay in force while the agent reads.

**Ends when** the findings file exists and its path is named. The stage goes on at the step it left.
