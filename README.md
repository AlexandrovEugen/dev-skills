# dev-skills

Personal agent skills and portable agent rules for software engineering.

| Skill | What it does |
|---|---|
| [`deep-review`](skills/deep-review/SKILL.md) | Reviews a whole repository, or one directory of it, for bugs, security holes and debt, verifies every finding against the code, and writes a Must / Should / Could Fix backlog. |
| [`sandbox-setup`](skills/sandbox-setup/SKILL.md) | Sets up any project, from an archive, a remote repo or a local folder, as a Docker sandbox: every repo it needs connected, a mock for everything outside, one container where an agent works on it, and a README that says how to use it. |
| [`workspace`](skills/workspace/SKILL.md) | Sets up a complete workspace (steering, rules, protocols, hooks and settings), pushes a change of its shared rules to this repository through a pull request, and syncs every registered workspace. |

## Portable rules

[agent-rules/](agent-rules/README.md) is the checked-in origin for universal agent rules. The `workspace` skill installs and syncs copies for any agent that reads `CLAUDE.md` or `AGENTS.md`, such as Claude Code or Codex. The skills themselves are written for Claude Code: they rely on its skill frontmatter and sub-agents, and only a Claude Code settings fragment exists.

## Install

Clone the repository, then link each skill you want into your user skills folder:

```bash
git clone https://github.com/AlexandrovEugen/dev-skills.git
ln -s "$PWD/dev-skills/skills/deep-review" ~/.claude/skills/deep-review
ln -s "$PWD/dev-skills/skills/sandbox-setup" ~/.claude/skills/sandbox-setup
ln -s "$PWD/dev-skills/skills/workspace" ~/.claude/skills/workspace
```

Restart the agent, then run `/deep-review <path>` in the repository you want reviewed, `/sandbox-setup <archive, git URL or folder>` with Docker running, or `/workspace setup <workspace-path> <workspace-name>` for a workspace.

## License

[MIT](LICENSE)
