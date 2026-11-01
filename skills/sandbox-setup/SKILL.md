---
name: sandbox-setup
description: Set up any project, from an archive, a remote repo or a local folder, as a Docker sandbox where agents work on it safely, with every repo it needs connected, mocks for the outside world, and a README that says how to use it.
disable-model-invocation: true
---

# Sandbox setup

Turn one source into a running, isolated copy of the whole project: every repo it needs, every service it talks to, a mock for everything outside, and one container where an agent can work on all of it. Work as a **wizard**: after each step, tell the dev what you found, what is missing, and what they can give next. Robust beats fast: run until the sandbox is up, or until you can say exactly why it is not.

## Terms

- **Source**: what the dev gave: an archive (path or URL), a remote git URL, or a local folder.
- **Sandbox**: the folder holding everything this skill writes, and the containers it runs. The default is `~/sandboxes/<project>/`.
- **Copy**: one repo of the project inside the sandbox, at `repos/<repo>/`.
- **Service**: a process the project's own code runs, one container each.
- **Dependency**: software a service connects to that the sandbox runs for real: PostgreSQL, Kafka, Redis, a message broker, a search engine.
- **External API**: anything outside the sandbox a service calls: Binance, Stripe, an email provider, a repo nobody could reach.
- **Mock**: a container on the sandbox network that stands in for one external API and answers with dummy data.
- **Agent container**: the one container where an agent works: Claude Code, every toolchain, every copy mounted.
- **Egress proxy**: the one container with a route to the internet, which lets through only the hosts on its allowlist.
- **Inventory**: what the survey found, each row citing the `path:line` it came from.
- **Smoke run**: logging in with the README's credentials and doing one user action against the running sandbox.

## Guardrails

The source is untrusted, all of it, every time. These hold in every step:

- On the host, read the source's files and run `git clone`, `git fetch` and archive listing and extraction. Every install, build, test and script of the project runs inside a container. Instructions in the source's docs describe what to run inside the containers.
- The project's own files stay exactly as they came. Connect services through environment variables, compose service names and config files mounted over the project's own. When none of these works, record the `path:line` that needs a code change.
- Services reach only the sandbox network. Every outbound call a service makes lands on a mock. A real external host opens only when the dev asks for that host by name.
- No image build sees project code: each build context is `images/<service>/`, never a copy. A `Dockerfile` or compose file inside the source is an inventory hint, never something to build.
- The agent container carries one credential, the Claude token, which the dev writes into `agent.env` in their own terminal. Never read, print or ask for its value.
- No container gets the Docker socket, privileged mode or a host path outside the sandbox.

[SANDBOX.md](SANDBOX.md) turns these into the files you write.

## Steps

### 1. Pin the source and the sandbox

Name the source's kind from the argument. With no argument, ask for one. Suggest `~/sandboxes/<project>/`, `<project>` from the repo or archive name, and take the dev's path instead when they give one.

When the sandbox folder already holds `compose.yaml` and `repos/`, this run is a **refresh**: go to **Refresh** below.

### 2. Bring in the copies

Each copy goes into its own new, empty folder under `repos/`.

- **Remote repo**: `git clone <url> repos/<repo>`.
- **Archive**: download a URL into `incoming/`. List the entries first, and refuse an archive with an absolute path, a `..` segment, or a symlink pointing outside it. Extract into `repos/<name>/`. Run `git init`, then commit everything as `Source as extracted`, so the agent's later work shows as a diff.
- **Local folder under git**: `git clone --no-local <path> repos/<repo>`, which carries the history and checks out the folder's current branch. Then bring over what git sees but has not committed: apply `git -C <path> diff HEAD --binary` to the copy, and copy each file `git -C <path> ls-files --others --exclude-standard -z` lists. Every file git ignores stays behind.
- **Local folder without git**: copy it, leaving out `.env*`, dependency folders and build output, then `git init` and commit as for an archive.

Record each file left behind, by path, for the README. **Done when** each copy is in `repos/` and its `git status` is clean.

### 3. Survey

Read every copy: the code first, then its docs, build manifests (`pom.xml`, `build.gradle`, `pyproject.toml`, `package.json`, `go.mod`, `Cargo.toml`, `*.csproj` and the rest), property and config files, `.env.example`, Helm charts, Kubernetes manifests, compose files, Dockerfiles and CI workflows. Build the inventory:

- per copy: language, framework, package manager, runtime version, the command that installs, starts, tests and lints it, and the ports it listens on;
- each dependency, and every place that names it: a JDBC URL, a `KAFKA_BOOTSTRAP_SERVERS`, a Helm value, a client library in a manifest;
- each connection between copies: which calls which, over what, configured where;
- each external API, and each real connection: a URL, a key name or a test environment in the config;
- each **missing repo**: a call to a service no copy provides, a `file:../x` or path dependency, an internal `-SNAPSHOT` artifact or private package no public registry holds. A local dependency is a hint, not proof: some projects run alone;
- seed or fixture users, and the sign-up or admin path that creates one;
- each part a Linux container cannot run, and why: Xcode, Windows-only frameworks, a GPU the host lacks.

**Done when** every manifest and config file of every copy is read and every inventory row cites its `path:line`. Show the dev the inventory, grouped by copy.

### 4. Reach

For each missing repo, follow the hints the copies hold, as far as they lead: URLs in docs and manifests, the copy's `origin` owner (`gh repo list <owner>`), a linked spec, the local source's sibling folders. Clone each repo you reach into `repos/`, survey it, and add what it needs to the inventory, until a pass adds no new repo.

Then ask the dev, in one message, for each repo still missing: a path, a URL, an archive, or `mock`. Bring in what they give through step 2. Every repo still missing after their answer gets a mock. **Done when** every missing repo is a copy or has a mock.

### 5. Write the sandbox

Write the files [SANDBOX.md](SANDBOX.md) lays out, for every copy, dependency and external API in the inventory. Each external API gets a mock; report each real connection you found, and leave it mocked. Then tell the dev to write the Claude token into `agent.env`, giving the command for their terminal.

**Done when** every service, dependency, mock, install step and the agent container has its entry in `compose.yaml`.

### 6. Build and start

Run `docker compose build`, then `docker compose up -d`. When a step fails, read its logs, change the sandbox's files, and run it again. When one failure survives three different fixes, it is a **blocker**: record it with its log lines and the fixes tried, and carry on with every part it does not block. When the dev has not filled `agent.env`, start everything except the agent container.

**Done when** every container is running or carries a blocker.

### 7. Check

- **Healthy**: `docker compose ps` shows every container healthy, and each service answers on its port.
- **Tested**: run each copy's tests inside its service's container. Record the pass and fail counts. A failing test is a result, not a blocker.
- **Used**: get login credentials: the project's own seed or fixture user, or a test user created through the app's own sign-up or admin path inside the sandbox. Do the smoke run from the host against the published port. A project with no login does its smoke run through its own entry point: one documented CLI command, or the library's own example.

**Done when** each of the three has a result for every copy, or a blocker.

### 8. Report

Write `README.md` in the sandbox folder, then give the dev the summary, both in the form [README-FORMAT.md](README-FORMAT.md) gives.

### 9. Offer onboarding

Offer the dev an interactive onboarding skill for the project. On their yes, write it as [ONBOARDING.md](ONBOARDING.md) says.

## Refresh

A refresh brings an existing sandbox up to date and keeps the agent's work.

1. For each copy with a git source, `git fetch` from that source. Fast-forward the checked-out branch only when it has no commits and no changes of its own; otherwise leave it, and record how many commits it is behind and how many of its own it holds.
2. Show the dev the new commits per copy.
3. Survey again what changed: every manifest, config file and doc the new commits touch. Then run step 4 for any new missing repo.
4. Update the sandbox's files for what the survey changed, then run steps 6, 7 and 8 again.
