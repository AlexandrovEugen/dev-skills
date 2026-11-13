---
name: workspace-rules
description: Install, promote, and synchronize personal agent rules between workspaces. Use when the dev asks to pull universal rules into a workspace, push a portable rule change into dev-skills, sync registered workspaces, or migrate workspace agent rules.
disable-model-invocation: true
---

# Workspace rules

Use the repository holding this skill as the `dev-skills` origin. Read [../../agent-rules/README.md](../../agent-rules/README.md), `UNIVERSAL.md`, and the relevant files under `skill-protocols/` before changing rules.

An invoked skill always governs this skill's work. This skill does not change another skill's steps.

## Pull

Use `pull <workspace-path> <workspace-name>` for a fresh workspace.

1. Update `dev-skills` from its default branch and read `agent-rules/UNIVERSAL.md`.
2. Inspect `<workspace-path>/AGENTS.md`, `<workspace-path>/CLAUDE.md`, `WORKSPACE.md`, and `MEMORY.md`.
3. If either agent file exists and lacks the `managed by dev-skills` marker, produce a migration plan and stop. Do not overwrite it.
4. Copy `UNIVERSAL.md` exactly to the workspace root as both `AGENTS.md` and `CLAUDE.md`.
5. Copy every file in `agent-rules/skill-protocols/` into `<workspace-path>/.agent-rules/skills/`.
6. Create `WORKSPACE.md` and `MEMORY.md` from the templates only when they do not exist.
7. Merge each supported platform fragment without removing workspace-owned settings. For Claude Code, merge `platforms/claude-code.json` into `.claude/settings.json`: append missing denied permissions and preserve all existing keys and values.
8. Add `<workspace-name>` and its absolute path to `agent-rules/workspaces.tsv` in `dev-skills`, or update its path when the name already exists. Include that registry change in the next `dev-skills` pull request.
9. Report every created or merged file and every local file left untouched.

## Push

Use `push <workspace-path>` after the dev has changed a managed universal rule or a managed skill protocol in a reference workspace.

1. Read the central source and the managed copies in the workspace.
2. Require both root agent files to have the marker and identical contents. If either condition fails, show the difference and stop.
3. Compare `AGENTS.md` with `agent-rules/UNIVERSAL.md`, and compare each workspace `.agent-rules/skills/` file with its central protocol.
4. Copy only changed managed files into `dev-skills`; never copy `WORKSPACE.md`, repository rules, settings outside managed fragments, or `MEMORY.md`.
5. Create a branch in `dev-skills`, commit the changes, push it, and open a pull request against the default branch. The pull request states which reference workspace supplied the change and which rules changed.
6. Stop after reporting the pull request URL. Do not merge it or run `sync-all`.

## Sync all

Use `sync-all` only after the dev asks for distribution and the relevant `dev-skills` pull request is merged.

1. Update `dev-skills` to its default branch.
2. Read every registered row in `agent-rules/workspaces.tsv`.
3. For each workspace, replace only root agent files with the marker and files under `.agent-rules/skills/` that correspond to central protocols.
4. Merge supported platform fragments without removing workspace-owned settings.
5. Do not replace `WORKSPACE.md`, repository-local rules, unmarked agent files, or `MEMORY.md`.
6. Report each workspace updated, skipped, or blocked and why.

## Migration

Use `migrate <workspace-path>` when a workspace already has agent files.

1. Read the existing agent files and every file they point to.
2. Classify each instruction as universal, workspace orientation, repository-specific, or platform setting.
3. Show a migration plan that names the source and destination of every instruction.
4. Wait for the dev to approve the plan before editing files.
5. Put universal candidates into managed copies only after the dev later invokes `push`; leave local material in `WORKSPACE.md` or repository-local files.
