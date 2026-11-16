---
name: workspace
description: Set up a complete workspace, push a change of its shared rules to dev-skills, and sync every registered workspace. Use when the dev asks to set up, push, or sync a workspace.
disable-model-invocation: true
---

# Workspace

Commands: `setup <workspace-path> <workspace-name>`, `push <workspace-path>`, `sync`.

The `dev-skills` origin is the git toplevel of this skill's folder after `realpath`. Read `GLOSSARY.md`, `agent-rules/README.md`, `agent-rules/UNIVERSAL.md`, and the files under `agent-rules/` that the command touches, at `origin/<default>`.

An invoked skill always governs this skill's work. This skill does not change another skill's steps.

## Managed files

A **managed file** is a root `AGENTS.md` or `CLAUDE.md`, or a file in `.agent-rules/skills/`, whose first line names its central source:

- `<!-- managed by dev-skills: agent-rules/UNIVERSAL.md -->` for a root agent file;
- `<!-- managed by dev-skills: agent-rules/skill-protocols/<name>.md -->` for a protocol.

Read that line from the file on disk. Claude Code hides HTML comments when it loads `CLAUDE.md`, so the loaded context does not show it. A file without that exact first line belongs to the workspace. A file inside a git repository below the workspace root belongs to that repository: read it, and never change it.

A managed file is **unedited** when it equals some version of its central source on the default branch:

```bash
for c in $(git -C <dev-skills> rev-list origin/<default> -- <central path>); do
  git -C <dev-skills> show "$c:<central path>" | cmp -s - <workspace file> && echo unedited && break
done
```

Replace or delete a managed file only when it is unedited. A managed file with local edits blocks its workspace: show its diff against the current central version, and leave it; `push` can send the edits.

`CLAUDE.md` is a symbolic link to `AGENTS.md`. Stop at any other link and report it.

## Before every command

1. In dev-skills, run `git status --porcelain`. Stop when it lists anything, and report it.
2. Run `git -C <dev-skills> fetch origin`, and find `<default>`: the output of `git -C <dev-skills> symbolic-ref --short refs/remotes/origin/HEAD` without its `origin/` prefix.
3. Read each central file at `origin/<default>` with `git show origin/<default>:<path>`, not from the working tree.

## Registry

`agent-rules/workspaces.local.tsv` in dev-skills lists the registered workspaces, one per line: the workspace name, a tab, its absolute path. Git ignores it.

## Steering

**Steering** is the workspace's local git repository for its own files, in `<workspace-path>/.steering.git`, with no remote. The **root repository** is the git repository whose root is the workspace root, when there is one.

To create steering:

1. `git --git-dir=<workspace-path>/.steering.git --work-tree=<workspace-path> init -q`.
2. Write `agent-rules/steering/exclude` to `.steering.git/info/exclude`. Without a root repository, append `agent-rules/steering/exclude-folder-root`.
3. Copy `agent-rules/steering/steering` to `<workspace-path>/.agent-rules/steering`, executable.
4. With a root repository, append to its `.git/info/exclude` each of `/AGENTS.md`, `/CLAUDE.md`, `/WORKSPACE.md`, `/GLOSSARY-MAP.md`, `/.agent-rules/`, `/.steering.git/` that `git check-ignore -q` does not already ignore.

Commit to steering with `<workspace-path>/.agent-rules/steering`, in the turn that changes a steering file.

## Setup

Use `setup <workspace-path> <workspace-name>` to create one complete workspace, new or existing.

1. Read the central sources and the platform fragments.
2. Read every agent file in the workspace: `AGENTS.md`, `CLAUDE.md`, `WORKSPACE.md`, `.agent-rules/`, `.claude/settings*.json`, and every file they point to.
3. When `.steering.git` does not exist, create steering, then commit what it tracks as `Steering before setup`.
4. When a root agent file or a file in `.agent-rules/skills/` with a central protocol's name exists and is not managed, sort each instruction it holds into one destination: `UNIVERSAL.md` through `push`, a protocol or extension skill in dev-skills through `push`, `WORKSPACE.md`, or the repository that owns it. Show the plan, source line to destination, and wait for the dev's yes. Then move the workspace instructions into `WORKSPACE.md` and list the rest for `push`.
5. Stop when a managed file has local edits, and show its diff.
6. Write `UNIVERSAL.md` exactly as `AGENTS.md`, and make `CLAUDE.md` a symbolic link to `AGENTS.md`.
7. Write every central protocol into `.agent-rules/skills/`.
8. Create `WORKSPACE.md` from `agent-rules/templates/WORKSPACE.md` only when it does not exist.
9. When a check names places on the dev's machine that belong to this workspace, write their patterns to `.agent-rules/host-paths`, one regular expression per line, after the dev's yes.
10. Merge each platform fragment into the workspace's personal settings, never into checked-in shared ones. For Claude Code, merge `platforms/claude-code.json` into `<workspace-path>/.claude/settings.local.json`:
    - replace `<node>` with `command -v node`, `<python3>` with `command -v python3`, and `<dev-skills>` with the dev-skills path;
    - append missing denied permissions;
    - append each hook group whose command no hook of that event already runs;
    - keep every other key and value; when the file does not parse as strict JSON, leave it and report it.

    With a root repository where `git check-ignore -q .claude/settings.local.json` fails, add that path to its `.git/info/exclude`.
11. Add `<workspace-name>` and its absolute path to the registry, or update its path.
12. Commit steering as `Set up the workspace from dev-skills <short commit>`.
13. Report each file created, changed, or left, and each item listed for `push`.

## Push

Use `push <workspace-path>` after the dev changed a managed file, or names a workspace file to share.

1. Require `AGENTS.md` to be managed and `CLAUDE.md` a link to it. If not, show the difference and stop.
2. Compare `AGENTS.md` with `UNIVERSAL.md`, and each managed file in `.agent-rules/skills/` with its central protocol.
3. Note the branch dev-skills is on, then `git -C <dev-skills> switch -c rules/<workspace-name>-<YYYY-MM-DD> origin/<default>`.
4. Copy only changed managed files into dev-skills. A workspace file goes in only when the dev names it, as the central file the dev names; a protocol gets its marker line as the first line of both copies. Never copy `WORKSPACE.md` whole, repository files, settings, steering, or the registry.
5. Commit, push the branch, and open a pull request against `<default>` that names the workspace and each changed file.
6. Switch dev-skills back to the branch noted in step 3. Report the pull request URL. Do not merge it or run `sync`.

## Sync

Use `sync` after the dev asks for distribution and the relevant dev-skills pull request is merged.

1. Read every central source and platform fragment.
2. For each registered workspace whose path is not a directory, report it blocked, path missing, and create nothing there.
3. In every other workspace:
   - create steering when `.steering.git` does not exist;
   - append to `.steering.git/info/exclude` each line of the central exclude files that it lacks, and replace `.agent-rules/steering` with the central copy;
   - replace each unedited managed file with its central version; delete each unedited managed protocol whose central protocol no longer exists; replace an unedited managed `CLAUDE.md` with a link to `AGENTS.md`; leave each managed file with local edits, and report its diff;
   - merge the platform fragments as **Setup** step 10 does;
   - commit steering as `Sync from dev-skills <short commit>`.
4. Do not change `WORKSPACE.md`, `.agent-rules/host-paths`, repository files, or files that are not managed.
5. Report each workspace updated, current, or blocked and why, and each file deleted.
