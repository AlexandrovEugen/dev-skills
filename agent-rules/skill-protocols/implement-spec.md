<!-- managed by dev-skills: agent-rules/skill-protocols/implement-spec.md -->
---
skill: implement-spec
with: [retro-ext@gather]
---
# implement-spec

Run the skill's steps in order. Each step is done only at its criterion. Every sub-agent starts with a fresh context window, and its prompt carries context pointers rather than copied text. Every implementer sub-agent works in its own worktree on its own branch, runs in the background where possible, and has a prompt that orders it to confirm its base, build with `tdd`, and merge the integration branch tip before reporting done.

## Step: read
done: Bash command ~ gh issue view
1. **Read the spec and tickets**: done when the spec and every ticket were read by a tool call in this session, and the task graph with its blocking edges and first frontier is stated.

## Step: branch
done: Bash command ~ git (checkout -b|switch -c|branch [^-])
2. **Exploration sub-agent (optional)**: done when its notes are saved outside the repo where every later sub-agent can read them, or the step is skipped.
3. **Create the integration branch**: done when the integration branch exists. When the tracker closes work through PRs, or the dev asked for one, a draft PR closing the spec and tickets opens after the first merge.

## Step: implementers
done: Agent
4. **Implementer sub-agents**: done when each frontier ticket has a fresh implementer sub-agent.

## Step: resolve
done: Bash command ~ gh (pr ready|issue close)
5. **Merger sub-agent**: done when each finished implementer's work is merged into the integration branch by a merger sub-agent.
6. **Frontier**: done when each ticket that a merge unblocked has its implementer sub-agent, and every ticket is complete.
7. **Code review**: done when the Skill tool was called with `code-review` on the integration branch, and one fresh implementer sub-agent fixed every issue the review raised, or the review raised none.
8. **Resolve**: done when the draft PR is marked ready for review, or each ticket is resolved the way the tracker closes work and the integration branch is reported.

## Step: cleanup
done: Bash command ~ git worktree (remove|prune)
9. **Clean up**: done when every implementer sub-agent worktree is removed.

## Step: gather
After the last implementer sub-agent worktree is removed, run `retro-ext` with the active skill `implement-spec`. The session ends with its one line.
