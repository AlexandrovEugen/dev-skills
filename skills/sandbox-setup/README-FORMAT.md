# README and summary format

Fill every `<…>`. Write a section's table with one row per item, or the word `None.` under its heading.

## README.md

````markdown
# <project> sandbox

<What the project is and who uses it, in two or three sentences, from its code and docs.>

Set up <YYYY-MM-DD> from <source>. Sandbox: `<sandbox path>`.

## Services

| Service | Copy | What it does | On the host |
|---|---|---|---|
| <service> | `repos/<repo>` | <one line> | http://127.0.0.1:<port> |

Dependencies: <dependency and version, comma-separated>.

## Run it

```bash
cd <sandbox path>
docker compose up -d
docker compose ps
docker compose logs -f <service>
docker compose down
docker compose down -v
```

`down -v` also deletes the databases' data.

## Use it

Open <the URL a user starts at>. Log in as:

| Role | Login | Password | Where it comes from |
|---|---|---|---|
| <role> | <login> | <password> | <seed file `path:line`, or created through <path>> |

<The first user action to try, in one or two steps.>

## Work on it with an agent

1. Run `claude setup-token` in your terminal, and put the token after `CLAUDE_CODE_OAUTH_TOKEN=` in `agent.env`.
2. `docker compose up -d agent`, then `docker compose exec agent claude`.

The agent sees every copy at `/work/<repo>`. Its edits reach the running services at once. It reaches only the Anthropic API, the package registries and the git hosts, and holds no git or GitHub credentials.

To take the agent's work back into your own checkout:

```bash
git -C <your checkout> fetch <sandbox path>/repos/<repo> <branch>:sandbox/<branch>
```

## Mocks

| Mock | Stands in for | Found at | Files |
|---|---|---|---|
| <mock> | <external API or missing repo> | `<path:line>` | `mocks/<name>/` |

Real connections found and left mocked: <host at `path:line`, comma-separated>. To open one, ask for it by name on the next run.

## Checks

| Copy | Healthy | Tests | Smoke run |
|---|---|---|---|
| <repo> | <yes, or the blocker> | <passed> passed, <failed> failed | <action and result> |

## Not run

| Part | Why |
|---|---|
| <part> | <reason> |

## Needs a code change

| Connection | `path:line` | What it hard-codes |
|---|---|---|
| <from → to> | `<path:line>` | <value> |

## Left behind

Files the copies did not take, each git-ignored in its source: <path, comma-separated>.

Capabilities added back: <container: capability, comma-separated>.
````

## Summary

Give it in chat, in this order:

```markdown
- **Detected Stack:** <per copy: language, framework, package manager>
- **Created Files:** <each file and folder the sandbox holds, outside `repos/`>
- **Container Status:** <Success or Failure>; <service on 127.0.0.1:<port>, comma-separated>
- **Checks:** <per copy: tests passed and failed, smoke run result>
- **Mocks:** <each mock and what it stands in for>
- **Not run:** <each part and why, or none>
- **Blockers:** <each blocker, its last log line and the fixes tried, or none>
- **Needs a code change:** <each `path:line`, or none>
- **README:** `<sandbox path>/README.md`
```
