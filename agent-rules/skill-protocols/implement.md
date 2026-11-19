<!-- managed by dev-skills: agent-rules/skill-protocols/implement.md -->
---
skill: implement
with: [retro-ext@gather]
---
# implement

Run the skill's steps in order. Each step is done only at its criterion.

## Step: build
done: Skill skill ~ (^|:)tdd$
1. **Fetch the ticket**: done when each ticket the dev referenced was read from the issue tracker by a tool call, and its title was stated before the first code change. An ambiguous reference is done only when the dev named the ticket.
2. **Build with `tdd`**: done when the Skill tool was called with `tdd` for the work, at the seams the dev agreed.

## Step: review
done: Skill skill ~ code-review
3. **Run the checks**: done when typechecking and single test files ran during the work, and the full test suite ran once after the last change and passed.
4. **Review**: done when the Skill tool is called with `code-review` on the work.

## Step: commit
done: Bash command ~ git commit
5. **Commit**: done when the reviewed work, with the fixes the review raised, is committed to the current branch.

## Step: gather
After the commit that follows the code review, run `retro-ext` with the active skill `implement`. The session ends with its one line.
