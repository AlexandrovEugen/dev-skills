<!-- managed by dev-skills: agent-rules/UNIVERSAL.md -->

# Universal agent rules

These rules apply in every workspace that installs them. They complement an invoked skill and do not replace its instructions.

## Skills

- An invoked skill governs its own work over every universal, workspace, and repository rule.
- Read the invoked skill in full and run every required step in its order and output format.
- Do the investigation, derivation, and checks the skill assigns to the agent before asking the dev a question.
- Ask the dev only for a decision that the skill, the dev's earlier input, and checked facts do not settle.
- Read `.agent-rules/skills/<skill-name>.md` when it exists for the invoked skill; it adds only guidance that helps the skill run.

## Evidence

- State what a system does from executable code and tests that run it.
- Treat comments and documentation as intent unless the task asks about intent.

## Rule scopes

- Keep durable rules in checked-in files that the dev can inspect, change, and revert.
- Write each rule as a short instruction with its scope or limit.
- Read `WORKSPACE.md` when it exists for workspace orientation, then read rules in the repository and directory that own the work.
- Outside an invoked skill, repository rules override workspace rules, and workspace rules override these universal rules.

## Persistent memory and attribution

- `MEMORY.md` is a pointer to maintained rule files; do not add rules, session history, or working notes to it.
- Do not add AI or vendor attribution to commits, pull requests, comments, or generated documents unless the dev asks for it.
