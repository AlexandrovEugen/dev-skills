<!-- managed by dev-skills: agent-rules/UNIVERSAL.md -->

# Universal agent rules

## Skills

- An invoked skill governs its own work over every universal, workspace, and repository rule.
- Read the invoked skill in full and run every required step in its order and output format.
- Do the investigation, derivation, and checks the skill assigns to the agent before asking the dev a question.
- Ask the dev only for a decision that the skill, the dev's earlier input, and checked facts do not settle.
- Run the invoked skill's protocol in `.agent-rules/skills/<skill-name>.md` when it exists, where `<skill-name>` is the skill's name without a plugin prefix.

## Evidence

- State what a system does from executable code and tests that run it.
- Treat comments and documentation as intent unless the task asks about intent.

## Rule scopes

- Keep durable rules in files that the dev can inspect, change, and revert.
- Write each rule as one short instruction: what to do, and its limit. Add how only when the what is not enough, and no reason.
- Put a rule change in its narrowest owner: a shared rule in this file or in `.agent-rules/skills/`, then run `/workspace-rules push`; a workspace rule in `WORKSPACE.md`; a repository rule in that repository.
- Read the rules of the repository and directory that own the work before working there.
- Outside an invoked skill, repository rules override workspace rules, and workspace rules override these universal rules.
- Workspace rules: @WORKSPACE.md

## Attribution

- Commits, pull requests, comments, and generated documents carry no AI or vendor attribution unless the dev asks for it.
