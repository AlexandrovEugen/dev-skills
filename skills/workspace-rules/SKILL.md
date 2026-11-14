---
name: workspace-rules
description: Install, promote, and synchronize personal agent rules between workspaces. Use when the dev asks to pull universal rules into a workspace, push a portable rule change into dev-skills, sync registered workspaces, or migrate workspace agent rules.
disable-model-invocation: true
---

# Workspace rules

The `dev-skills` origin is the git toplevel of this skill's folder after `realpath`. The skill is usually installed as a symlink, so a path taken relative to the link does not reach the repository. Read `agent-rules/README.md`, `agent-rules/UNIVERSAL.md`, and the relevant files under `agent-rules/skill-protocols/` there before changing rules.

An invoked skill always governs this skill's work. This skill does not change another skill's steps.

## Managed files

A **managed file** is a root `AGENTS.md` or `CLAUDE.md`, or a file in `.agent-rules/skills/`, whose first line names its central source:

- `<!-- managed by dev-skills: agent-rules/UNIVERSAL.md -->` for a root agent file;
- `<!-- managed by dev-skills: agent-rules/skill-protocols/<name>.md -->` for a protocol.

Read that line from the file on disk. Claude Code hides HTML comments when it loads `CLAUDE.md`, so the loaded context does not show it. A file without that exact first line belongs to the workspace.

A managed file is **unedited** when it equals some version of its central source on the default branch:

```bash
for c in $(git -C <dev-skills> rev-list origin/<default> -- <central path>); do
  git -C <dev-skills> show "$c:<central path>" | cmp -s - <workspace file> && echo unedited && break
done
```

Replace or delete a managed file only when it is unedited. A managed file with local edits blocks its workspace. Show its diff against the current central version, and leave it alone; `push` can promote the edits.

When a root agent file is a symlink, keep a `CLAUDE.md` that links to the sibling `AGENTS.md`, and write only `AGENTS.md`. Stop at any other link and report it.

## Before every subcommand

1. In dev-skills, run `git status --porcelain`. Stop when it lists anything, and report it.
2. Run `git -C <dev-skills> fetch origin`, and find `<default>`: the output of `git -C <dev-skills> symbolic-ref --short refs/remotes/origin/HEAD` without its `origin/` prefix.
3. Read each central file at `origin/<default>` with `git show origin/<default>:<path>`, not from the working tree, so the checked-out branch does not matter.

## Registry

`agent-rules/workspaces.local.tsv` in dev-skills lists the registered workspaces, one per line: the workspace name, a tab, its absolute path. Git ignores it, so it stays on this machine and enters no pull request.

## Pull

Use `pull <workspace-path> <workspace-name>` for a fresh workspace.

1. Read `UNIVERSAL.md`, the protocols and the platform fragments at `origin/<default>`.
2. Inspect `<workspace-path>/AGENTS.md`, `<workspace-path>/CLAUDE.md`, `<workspace-path>/WORKSPACE.md`, `<workspace-path>/MEMORY.md`, and `<workspace-path>/.agent-rules/skills/`.
3. Stop when either root agent file exists and is not managed, or when a file in `.agent-rules/skills/` has a central protocol's name and is not managed: offer `migrate`. Stop when a managed file has local edits, and show its diff. Do not overwrite either.
4. Write `UNIVERSAL.md` exactly as `AGENTS.md` and `CLAUDE.md` at the workspace root.
5. Write every central protocol into `<workspace-path>/.agent-rules/skills/`.
6. Create `WORKSPACE.md` and `MEMORY.md` from the templates only when they do not exist.
7. Merge each supported platform fragment into the workspace's personal settings, never into checked-in shared ones. For Claude Code, merge `platforms/claude-code.json` into `<workspace-path>/.claude/settings.local.json`: append missing denied permissions and keep every existing key and value. When the file exists and does not parse as strict JSON, leave it unchanged and report it. In a git workspace where `git check-ignore -q .claude/settings.local.json` fails, add that path to `.git/info/exclude`.
8. Add `<workspace-name>` and its absolute path to the registry, or update its path when the name already exists.
9. Report every created or merged file and every local file left untouched.

## Push

Use `push <workspace-path>` after the dev has changed a managed universal rule or a managed skill protocol in a reference workspace.

1. Read the central sources at `origin/<default>` and the managed files in the workspace.
2. Require both root agent files to be managed, and identical or `CLAUDE.md` a link to `AGENTS.md`. If either condition fails, show the difference and stop.
3. Compare `AGENTS.md` with `UNIVERSAL.md`, and each managed file in `.agent-rules/skills/` with its central protocol.
4. Note the branch dev-skills is on, then `git -C <dev-skills> switch -c rules/<workspace-name>-<YYYY-MM-DD> origin/<default>`.
5. Copy only changed managed files into dev-skills. Never copy `WORKSPACE.md`, repository rules, settings, `MEMORY.md`, or the registry.
6. Commit the changes, push the branch, and open a pull request against `<default>`. The pull request states which reference workspace supplied the change and which rules changed.
7. Switch dev-skills back to the branch noted in step 4. Report the pull request URL. Do not merge it or run `sync-all`.

## Sync all

Use `sync-all` only after the dev asks for distribution and the relevant `dev-skills` pull request is merged.

1. Read every central source and platform fragment at `origin/<default>`.
2. For each registered workspace whose path is not a directory, report it as blocked, path missing, and create nothing there.
3. In every other workspace, replace each unedited managed file with its central version. Delete each unedited managed file in `.agent-rules/skills/` whose central protocol no longer exists. Leave every managed file with local edits, and report its diff.
4. Merge supported platform fragments as **Pull** step 7 does.
5. Do not replace `WORKSPACE.md`, repository-local rules, files that are not managed, or `MEMORY.md`.
6. Report each workspace updated, skipped, or blocked and why, and each file deleted.

## Migration

Use `migrate <workspace-path>` when a workspace already has agent files.

1. Read the existing agent files and every file they point to.
2. Classify each instruction as universal, workspace orientation, repository-specific, or platform setting.
3. Show a migration plan that names the source and destination of every instruction.
4. Wait for the dev to approve the plan before editing files.
5. Put universal candidates into managed copies only after the dev later invokes `push`; leave local material in `WORKSPACE.md` or repository-local files.
