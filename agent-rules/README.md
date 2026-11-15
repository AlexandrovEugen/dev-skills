# Agent rules

`UNIVERSAL.md` is the checked-in source for the identical root `AGENTS.md` and `CLAUDE.md` files that the `workspace-rules` skill installs.

`skill-protocols/` holds one protocol per skill: `domain-modeling`, `grill-with-docs`, `grilling`, and `retro`. A protocol holds only checks that its skill is called and run as written: the Skill tool calls it makes, a check per step or format of the skill, and the skill's own end. Behaviour the skill lacks goes into an extension skill in `skills/`, never into a protocol or a rule; a skill the dev does not own stays unedited. Each protocol's first line is the marker `<!-- managed by dev-skills: agent-rules/skill-protocols/<name>.md -->`, which tells a managed copy from a workspace's own file.

`platforms/` holds settings fragments. The skill merges a fragment only where the platform supports it, into the workspace's personal settings (`.claude/settings.local.json` for Claude Code), and preserves workspace-owned settings. `platforms/claude-code.json` denies `AskUserQuestion` and `mcp__ccd_turn__wrap_up` because the dev prefers not to use them; agents ask in plain chat instead. That is a personal preference, which is why the fragment goes into personal settings and not into a workspace's shared ones.

`templates/` contains the local files created for a fresh workspace. `WORKSPACE.md` is local orientation. `MEMORY.md` is a tombstone.

`workspaces.local.tsv` lists the workspaces registered on this machine for `sync-all`, one per line: the workspace name, a tab, its absolute path. Git ignores it, so personal paths stay out of the repository.
