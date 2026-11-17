<!-- managed by dev-skills: agent-rules/UNIVERSAL.md -->

# Universal agent rules

## Skills

- An invoked skill governs its own work over every universal, workspace, and repository rule.
- Read the invoked skill in full and run every required step in its order and output format.
- Do the investigation, derivation, and checks the skill assigns to the agent before asking the dev a question.
- Ask the dev only for a decision that the skill, the dev's earlier input, and checked facts do not settle.
- Run the invoked skill's protocol in `.agent-rules/skills/<skill-name>.md` when it exists, where `<skill-name>` is the skill's name without a plugin prefix.
- Run each extension skill the protocol names with the skill.

## Evidence

- State what a system does from executable code and tests that run it.
- Treat comments and documentation as intent unless the task asks about intent.
- Open every source a material points to before acting on that material.
- Before a deliverable, show proof that each step the skill requires for it ran. Without that proof, run the step first.

## Decisions

- When two instructions point opposite ways on this turn, name both in one sentence and stop.
- A review, audit, check, or retro changes nothing until the dev accepts its findings, unless its skill orders the fix.
- Propose dropping work in one list with reasons, and drop nothing yourself.
- When a skill, an ADR, a ruling, or a measured fact settles an answer, state it in one line and work.
- Stop and ask only when an answer is undetermined, or the act is hard to reverse and outward-facing, such as a push, a deploy, a deletion, or a message, and no ruling orders it.

## Words

- Every noun is a `GLOSSARY.md` term as spelled there, a name in the code, or plain English.
- Read a word the dev dictates that no glossary or code holds as the nearest name in context, and state that reading in one line.
- Reply to the dev in Simplified Technical English: short sentences, one fact each.
- Write a ruling into an artefact in your own words, never as a quoted chat message.
- Code carries no comment, docstring, or module header, except a test's `# given`, `# when`, `# then` markers.

## A repository holds only itself

- Bring no code, value, or importer from outside a repository into it.
- A value from outside the repository reaches its code at run time, from the environment or the database, never written into code, data files, or tests.
- Name no path, folder, or file on the dev's machine in a repository: its code, tests, docs, commits, or pull requests.

## Rule scopes

- Keep durable rules in files that the dev can inspect, change, and revert.
- Write each rule as one short instruction: what to do, and its limit. Add how only when the what is not enough, and no reason.
- Change a rule only on the dev's order, and show its line and file before writing it.
- Put a rule change in its narrowest owner: a shared rule in this file, in `.agent-rules/skills/`, or in an extension skill, then run `/workspace push`; a workspace rule in `WORKSPACE.md`; a repository rule in that repository.
- Rewrite a rule file as a whole, merging each change so the file does not grow.
- Commit a changed workspace file with `.agent-rules/steering` in the turn that changes it.
- Read the rules of the repository and directory that own the work before working there.
- Outside an invoked skill, repository rules override workspace rules, and workspace rules override these universal rules.
- Workspace rules: @WORKSPACE.md

## Attribution

- Commits, pull requests, comments, and generated documents carry no AI or vendor attribution unless the dev asks for it.
