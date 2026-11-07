# dev-skills

Personal agent skills and portable agent rules for software engineering.

| Skill | What it does |
|---|---|
| [`deep-review`](skills/deep-review/SKILL.md) | Reviews a whole repository, or one directory of it, for bugs, security holes and debt, verifies every finding against the code, and writes a Must / Should / Could Fix backlog. |
| [`sandbox-setup`](skills/sandbox-setup/SKILL.md) | Sets up any project, from an archive, a remote repo or a local folder, as a Docker sandbox: every repo it needs connected, a mock for everything outside, one container where an agent works on it, and a README that says how to use it. |
| [`workspace-rules`](skills/workspace-rules/SKILL.md) | Pulls personal agent rules into a fresh workspace, promotes portable rule changes through a pull request, and synchronizes registered workspaces. |

## Portable rules

[agent-rules/](agent-rules/README.md) is the checked-in origin for universal agent rules. The `workspace-rules` skill installs and synchronizes copies for Claude Code, Codex, and other agents that read `CLAUDE.md` or `AGENTS.md`.

## Install

Clone the repository, then link each skill you want into your user skills folder:

```bash
git clone https://github.com/AlexandrovEugen/dev-skills.git
ln -s "$PWD/dev-skills/skills/deep-review" ~/.claude/skills/deep-review
ln -s "$PWD/dev-skills/skills/sandbox-setup" ~/.claude/skills/sandbox-setup
ln -s "$PWD/dev-skills/skills/workspace-rules" ~/.claude/skills/workspace-rules
```

Restart the agent, then run `/deep-review <path>` in the repository you want reviewed, `/sandbox-setup <archive, git URL or folder>` with Docker running, or `/workspace-rules pull <workspace-path> <workspace-name>` for a fresh workspace.

## License

[MIT](LICENSE)
