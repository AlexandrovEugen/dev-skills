# dev-skills

Agent skills for software engineering, written for [Claude Code](https://claude.com/claude-code).

| Skill | What it does |
|---|---|
| [`deep-review`](skills/deep-review/SKILL.md) | Reviews a whole repository, or one directory of it, for bugs, security holes and debt, verifies every finding against the code, and writes a Must / Should / Could Fix backlog. |

## Install

Clone the repository, then link each skill you want into your user skills folder:

```bash
git clone https://github.com/AlexandrovEugen/dev-skills.git
ln -s "$PWD/dev-skills/skills/deep-review" ~/.claude/skills/deep-review
```

Restart Claude Code, then run `/deep-review <path>` in the repository you want reviewed.

## License

[MIT](LICENSE)
