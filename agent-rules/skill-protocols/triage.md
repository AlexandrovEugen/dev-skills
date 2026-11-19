<!-- managed by dev-skills: agent-rules/skill-protocols/triage.md -->
---
skill: triage
scope: session
with: [retro-ext@gather]
---
# triage

Run the skill's steps in order for each issue or PR the maintainer names. Each step is done only at its criterion. Every comment or issue posted to the tracker starts with the skill's AI disclaimer. Each triaged issue ends with exactly one category role and one state role.

To show what needs attention: done when the three buckets are shown oldest first, with counts and one line per item, and the maintainer picked.

1. **Gather context**: done when the full issue or PR, with its comments, labels and prior triage notes, and a PR's diff, was read by a tool call, and the redundancy search and the `.out-of-scope/` read both ran.
2. **Recommend**: done when the category, the state, the reasons and the codebase summary were shown, and the maintainer gave direction.
3. **Verify the claim**: done when the result is reported as confirmed with its code path, failed, or insufficient detail.
4. **Grill (if needed)**: done when the Skill tool was called with `grilling` and `domain-modeling` and the request is in shape, or no grilling was needed.

## Step: apply
done: Bash command ~ gh (issue|pr) (comment|close|edit)
5. **Apply the outcome**: done when the state role is applied with the comment, brief, triage notes, `.out-of-scope/` entry or close that the state requires. A quick state override is done when the maintainer confirmed the role change, comment and close.

## Step: gather
After the outcome of every issue or PR the maintainer named is applied, run `retro-ext` with the active skill `triage`. The session ends with its one line.
