# Sandbox files

How each guardrail in [SKILL.md](SKILL.md) becomes files. Fill every `<…>` from the inventory.

## Layout

```
<sandbox>/
├── compose.yaml
├── .env                      compose values: UID, GID, generated passwords
├── agent.env                 the Claude token, written by the dev, mode 600
├── README.md
├── repos/<repo>/             the copies, unchanged
├── incoming/                 downloaded archives
├── images/<name>/Dockerfile  one per service, plus agent, egress, ingress
├── env/<service>.env         each service's environment: connections to dependencies, copies and mocks
├── overrides/<service>/…     config files mounted over a copy's own, at the same relative path
├── egress/allowlist.txt      the hosts the egress proxy lets through
└── mocks/<name>/             one per external API
```

A build context holds only its `Dockerfile`, so it needs no `.dockerignore`.

## Networks

Two networks. Everything sits on `sandbox`, which has no route out. Only `egress` and `ingress` also sit on `outside`.

- **Egress proxy** (`egress`): Squid built on `debian:bookworm-slim`, listening on 3128, with `http_access allow` for the domains in `egress/allowlist.txt` and `deny all` after them. The allowlist holds only what the inventory needs: `api.anthropic.com`, the package registries the copies use (`registry.npmjs.org`, `pypi.org`, `files.pythonhosted.org`, `repo.maven.apache.org`, `plugins.gradle.org`, `proxy.golang.org`, `index.crates.io` and the like), and the git hosts of the sources.
- **Ingress** (`ingress`): `socat` built on `debian:bookworm-slim`, one forwarder per published port, from `0.0.0.0:<port>` to `<service>:<port>`. Docker publishes no port from a container that sits only on an internal network, so every port the dev uses goes through `ingress`, bound to `127.0.0.1`.

The install steps and the agent container get `HTTP_PROXY`, `HTTPS_PROXY`, `http_proxy` and `https_proxy` set to `http://egress:3128`, and `NO_PROXY` listing every compose service name. A tool that ignores those variables gets the proxy through its own config file mounted into the container: `~/.m2/settings.xml` for Maven, `gradle.properties` for Gradle. Services get no proxy variables.

## Hardening

Every container takes this block, sized for its stack:

```yaml
x-hardening: &hardening
  security_opt: ["no-new-privileges:true"]
  cap_drop: ["ALL"]
  pids_limit: 512
  mem_limit: <2g>
  cpus: <2>
  restart: "no"
```

Start every container with all capabilities dropped. When an image's entrypoint fails on a permission, add back the one capability its log names, and list each one in the README. Keep the sum of `mem_limit` under `docker info --format '{{.MemTotal}}'`.

## Service images

Each service image is a development image: the stack's toolchain, a non-root user, no project code.

```dockerfile
FROM <toolchain image>:<version>
ARG UID=1000
ARG GID=1000
RUN <install curl, git, ca-certificates> \
 && <create or rename a user "sandbox" with UID and GID, home /home/sandbox>
USER sandbox
WORKDIR /work/<repo>
```

Take `<version>` from the copy's own files (`.nvmrc`, `engines`, `.python-version`, `requires-python`, `.java-version`, `go.mod`, `rust-toolchain.toml`), else the stack's current LTS. When the base image already has a user at that UID, such as `node`, rename it. Write `UID` and `GID` from `id -u` and `id -g` into `.env`.

## Install steps and services

Dependencies install at run time, in a one-shot install step behind the egress proxy, because a `RUN` line in a build cannot be held to the allowlist. Each service waits for its install step and its dependencies:

```yaml
services:
  <service>-install:
    <<: *hardening
    build: { context: images/<service>, args: { UID: "${UID}", GID: "${GID}" } }
    command: [<install command>]
    volumes: ["./repos/<repo>:/work/<repo>", "<cache volume>:/home/sandbox/<cache dir>"]
    environment: { <proxy variables> }
    networks: [sandbox]

  <service>:
    <<: *hardening
    build: { context: images/<service>, args: { UID: "${UID}", GID: "${GID}" } }
    command: [<development start command>]
    env_file: [env/<service>.env]
    volumes:
      - ./repos/<repo>:/work/<repo>
      - <cache volume>:/home/sandbox/<cache dir>
      - ./env/<service>.env:/work/<repo>/.env:ro
      - ./overrides/<service>/<path>:/work/<repo>/<path>:ro
    depends_on:
      <service>-install: { condition: service_completed_successfully }
      <dependency>: { condition: service_healthy }
    healthcheck:
      test: ["CMD-SHELL", "curl -fsS http://localhost:<port><health path> || bash -c '</dev/tcp/127.0.0.1/<port>'"]
      interval: 10s
      retries: 30
    networks: [sandbox]
```

Install where the stack's own tooling puts dependencies: a folder in the copy that its `.gitignore` already ignores (`node_modules`, `.venv`), or a named cache volume (`~/.m2`, `~/.gradle`, `~/go/pkg`, `~/.cargo`). Mount the `.env` file only where the copy reads one, and an override only where an environment variable cannot set the value.

A service reaches another service, a dependency or a mock by its compose name: `postgres:5432`, `rs-core:8080`, `binance-mock:8080`.

## Dependencies

Use each dependency's official image, at the version the source names (a Helm chart, a compose file, a doc, a client library's supported range), else its current stable release. Generate each password with `openssl rand -hex 16` into `.env`. Give each one a health check from its own tools: `pg_isready`, `redis-cli ping`, `mysqladmin ping`, `kafka-broker-api-versions.sh`. Publish a dependency's port through `ingress` only when the README tells the dev to use it.

## Mocks

Each mock answers the requests the calling code makes, with dummy data shaped as the code parses it.

- Prefer a stand-in that speaks the real protocol: MinIO for S3, Mailpit for SMTP, LocalStack for other AWS services, a fake OAuth server for an identity provider.
- Otherwise use WireMock, pinned to a version, with one mapping in `mocks/<name>/mappings/` per endpoint the code calls. Build each mapping from the calling code, the client library's types, and an OpenAPI or other spec when the source holds one. A missing repo's mock follows the same rule, from its callers.
- Point the service at the mock through the setting that holds the base URL, in `env/<service>.env` or an override. When the code hard-codes the host, give the mock that host name as a network alias. When it also hard-codes HTTPS, add a sandbox CA to the service image's trust store and serve a certificate for that name from the mock; when that fails, record the `path:line` as a connection that needs a code change.

A real external host opens only on the dev's request by name: add it to `egress/allowlist.txt`, give that one service the proxy variables, and list it in the README.

## Agent container

```yaml
  agent:
    <<: *hardening
    build: { context: images/agent, args: { UID: "${UID}", GID: "${GID}" } }
    command: ["sleep", "infinity"]
    env_file: [agent.env]
    environment: { <proxy variables>, CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1" }
    volumes: ["./repos:/work"]
    working_dir: /work
    networks: [sandbox]
```

Its image holds `git`, `curl`, `ca-certificates`, every toolchain the services use at the same versions, and Claude Code installed as the non-root user with `curl -fsSL https://claude.ai/install.sh | bash`. Write `agent.env` as the one line `CLAUDE_CODE_OAUTH_TOKEN=`, mode 600; the dev fills it with the token `claude setup-token` prints in their terminal. The agent sees every copy at `/work/<repo>`, the same files the services run, so its edits reach the running services without a rebuild.
