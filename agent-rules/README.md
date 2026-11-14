# Agent rules

`UNIVERSAL.md` is the checked-in source for the identical root `AGENTS.md` and `CLAUDE.md` files that the `workspace-rules` skill installs.

`skill-protocols/` holds guidance that complements one skill. The portable protocols currently cover `domain-modeling`, `grill-with-docs`, `grilling`, and `retro`. A protocol never changes the steps, order, or output format of that skill. Each protocol's first line is the marker `<!-- managed by dev-skills: agent-rules/skill-protocols/<name>.md -->`, which tells a managed copy from a workspace's own file.

`platforms/` holds settings fragments. The skill merges a fragment only where the platform supports it, into the workspace's personal settings (`.claude/settings.local.json` for Claude Code), and preserves workspace-owned settings.

`templates/` contains the local files created for a fresh workspace. `WORKSPACE.md` is local orientation. `MEMORY.md` is a tombstone.

`workspaces.local.tsv` lists the workspaces registered on this machine for `sync-all`, one per line: the workspace name, a tab, its absolute path. Git ignores it, so personal paths stay out of the repository.
