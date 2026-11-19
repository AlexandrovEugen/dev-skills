<!-- managed by dev-skills: agent-rules/skill-protocols/implement-spec.md -->
---
skill: implement-spec
scope: session
with: [retro-ext@gather]
---
# implement-spec

Run the skill's steps in order. Each step is done only at its criterion. Every subagent starts with a fresh context window, and its prompt carries context pointers rather than copied text.

1. **Read the spec and tickets**: done when the spec and every ticket were read by a tool call in this session, and the task graph with its blocking edges and first frontier is stated.
2. **Exploration subagent (optional)**: done when its notes are saved outside the repo where every later subagent can read them, or the step is skipped.

## Step: branch
done: Bash command ~ git (checkout -b|switch -c|branch [^-])
3. **Create the integration branch**: done when the integration branch exists. When the tracker closes work through PRs, or the dev asked for one, a draft PR closing the spec and tickets opens after the first merge.

## Step: tickets
done: Skill skill ~ code-review
4. **Implementer subagents**: done when each frontier ticket has a fresh implementer subagent in its own worktree on its own branch, run in the background where possible, whose prompt orders it to confirm its base, build with `tdd`, and merge the integration branch tip before reporting done.
5. **Merger subagent**: done when each finished implementer's work is merged into the integration branch by a merger subagent.
6. **Frontier**: done when each ticket that a merge unblocked has its implementer subagent, and every ticket is complete.
7. **Call code review**: done when the Skill tool is called with `code-review` on the integration branch.

## Step: resolve
done: Bash command ~ gh (pr ready|issue close)
7. **Fix the review**: done when one fresh implementer subagent fixed every issue the review raised, or the review raised none.
8. **Resolve**: done when the draft PR is marked ready for review, or each ticket is resolved the way the tracker closes work and the integration branch is reported.

## Step: cleanup
done: Bash command ~ git worktree (remove|prune)
9. **Clean up**: done when every implementer subagent worktree is removed.

## Step: gather
After the last implementer subagent worktree is removed, run `retro-ext` with the active skill `implement-spec`. The session ends with its one line.
