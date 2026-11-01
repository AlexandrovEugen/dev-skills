# dev-skills

Agent skills for software engineering, written for [Claude Code](https://claude.com/claude-code).

| Skill | What it does |
|---|---|
| [`deep-review`](skills/deep-review/SKILL.md) | Reviews a whole repository, or one directory of it, for bugs, security holes and debt, verifies every finding against the code, and writes a Must / Should / Could Fix backlog. |
| [`sandbox-setup`](skills/sandbox-setup/SKILL.md) | Sets up any project, from an archive, a remote repo or a local folder, as a Docker sandbox: every repo it needs connected, a mock for everything outside, one container where an agent works on it, and a README that says how to use it. |

## Install

Clone the repository, then link each skill you want into your user skills folder:

```bash
git clone https://github.com/AlexandrovEugen/dev-skills.git
ln -s "$PWD/dev-skills/skills/deep-review" ~/.claude/skills/deep-review
ln -s "$PWD/dev-skills/skills/sandbox-setup" ~/.claude/skills/sandbox-setup
```

Restart Claude Code, then run `/deep-review <path>` in the repository you want reviewed, or `/sandbox-setup <archive, git URL or folder>` with Docker running.

## License

[MIT](LICENSE)
