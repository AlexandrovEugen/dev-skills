<!-- managed by dev-skills: agent-rules/skill-protocols/to-tickets.md -->
---
skill: to-tickets
scope: session
with: [retro-ext@gather]
---
# to-tickets

Run the skill's steps in order. Each step is done only at its criterion.

1. **Gather context**: done when the full body and every comment of each referenced spec or issue were read by a tool call in this session.
2. **Explore the codebase**: done when `GLOSSARY.md` and the ADRs of the area were read, and each ticket title uses glossary terms.
3. **Draft vertical slices**: done when each ticket is a tracer bullet with its blocking edges, and each wide refactor is sequenced as expand–contract.
4. **Quiz the user**: done when the dev approved the numbered breakdown in words.

## Step: publish
done: Bash command ~ gh issue create
5. **Publish the tickets to the configured tracker**: done when every approved ticket is published in the skill's issue template, blockers first, as a sub-issue when the source was an issue, with the `ready-for-agent` label unless the dev said otherwise. The parent issue stays unchanged.

## Step: gather
After the last ticket and its blocking edges are published, run `retro-ext` with the active skill `to-tickets`. The session ends with its one line.
