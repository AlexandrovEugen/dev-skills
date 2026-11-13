# Agent rules

`UNIVERSAL.md` is the checked-in source for the identical root `AGENTS.md` and `CLAUDE.md` files that the `workspace-rules` skill installs.

`skill-protocols/` holds guidance that complements one skill. The portable protocols currently cover `domain-modeling`, `grill-with-docs`, `grilling`, and `retro`. A protocol never changes the steps, order, or output format of that skill.

`platforms/` holds settings fragments. The skill merges a fragment only where the platform supports it and preserves workspace-owned settings.

`templates/` contains the local files created for a fresh workspace. `WORKSPACE.md` is local orientation. `MEMORY.md` is a tombstone.

`workspaces.tsv` lists registered workspaces for `sync-all`. The first column is the workspace name and the second is its absolute path.
