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
├── mirrors/<repo>.git        bare mirrors of git sources, written only by the host, never mounted writable
├── incoming/                 downloaded archives, and the patch and tar of a local source's uncommitted work
├── images/<name>/Dockerfile  one per copy, plus agent, egress, ingress, gitread
├── env/<service>.env         each service's environment: connections to dependencies, copies and mocks
├── env/<repo>-test.env       the connections a copy's tests read
├── overrides/<service>/…     config files mounted over a copy's own, at the same relative path
├── egress/squid.conf         the proxy's rules, per client address
├── egress/allowlist.txt      the hosts the install steps reach
└── mocks/<name>/             one per external API
```

A build context holds only its `Dockerfile`, so it needs no `.dockerignore`.

## Networks

Three networks, and only `egress` and `ingress` reach the internet:

```yaml
networks:
  sandbox: { internal: true }
  proxy:
    internal: true
    ipam: { config: [{ subnet: <10.231.0.0/24>, ip_range: <10.231.0.128/25> }] }
  outside: {}
```

- `sandbox` holds every service, dependency, mock, install step, the agent and `ingress`. `internal: true` gives it no route out.
- `proxy` holds `egress` and the only containers that may use it: the install steps, the agent, and a service the dev opened a host for. It is internal too, so its one way out is the proxy. A service that is not on it cannot even resolve `egress`. Pick a subnet that no existing Docker network uses (`docker network inspect $(docker network ls -q) --format '{{range .IPAM.Config}}{{.Subnet}} {{end}}'`). Docker hands out dynamic addresses from `ip_range` only, so the fixed addresses below `.128` stay free: `egress` at `.2`, the agent at `.10`, opened services from `.20`.
- `outside` is a normal bridge for `egress` and `ingress`.

```yaml
  egress:
    <<: *hardening
    build: { context: images/egress }
    command: ["squid", "-N", "-f", "/etc/squid/sandbox/squid.conf"]
    volumes: ["./egress:/etc/squid/sandbox:ro"]
    networks:
      proxy: { ipv4_address: <subnet>.2 }
      outside: {}

  ingress:
    <<: *hardening
    build: { context: images/ingress }
    command: ["sh", "-c", "socat TCP-LISTEN:<port>,fork,reuseaddr TCP:<service>:<port> & <one per port> wait"]
    ports: ["127.0.0.1:<port>:<port>"]
    networks: [sandbox, outside]
```

- **Egress proxy** (`egress`): Squid on `debian:bookworm-slim` (`apt-get install squid`), with `USER proxy` in its Dockerfile, so it starts unprivileged and needs no capability. It tells clients apart by address. The agent holds the Claude token, and any project code it runs can read the token, so the agent reaches `api.anthropic.com` alone and no host where that code could push or publish it. Each opened service reaches only its own host. Every other client on `proxy`, which means the install steps, reaches the domains in `egress/allowlist.txt`. That list holds only what the inventory needs: the package registries the copies use (`registry.npmjs.org`, `pypi.org`, `files.pythonhosted.org`, `repo.maven.apache.org`, `plugins.gradle.org`, `proxy.golang.org`, `index.crates.io` and the like), and the git hosts of the sources. `egress/squid.conf`:

  ```
  http_port 3128
  pid_filename /tmp/squid.pid
  pinger_enable off
  cache_log stdio:/dev/stderr
  access_log stdio:/dev/stdout
  acl agent src <subnet>.10
  acl anthropic dstdomain api.anthropic.com
  acl install_hosts dstdomain "/etc/squid/sandbox/allowlist.txt"
  acl SSL_ports port 443
  acl CONNECT method CONNECT
  http_access deny CONNECT !SSL_ports
  http_access allow agent anthropic
  http_access deny agent
  # one block per opened service, at <subnet>.20 and up:
  # acl <service> src <subnet>.<n>
  # acl <service>_hosts dstdomain <host>
  # http_access allow <service> <service>_hosts
  # http_access deny <service>
  http_access allow install_hosts
  http_access deny all
  ```
- **Ingress** (`ingress`): `socat` on `debian:bookworm-slim`, one forwarder per published port, from `0.0.0.0:<port>` to `<service>:<port>`. Docker publishes no port from a container that sits only on internal networks, so every port the dev uses goes through `ingress`, bound to `127.0.0.1`.

The install steps and the agent get `HTTP_PROXY`, `HTTPS_PROXY`, `http_proxy` and `https_proxy` set to `http://egress:3128`, and `NO_PROXY` listing every compose service name. A tool that ignores those variables gets the proxy through its own config file mounted into the container: `~/.m2/settings.xml` for Maven, `gradle.properties` for Gradle. Services get no proxy variables.

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

Start every container with all capabilities dropped. Run each official dependency image as its own non-root user (`user: postgres`, `user: redis`, `user: mysql`) with a named volume at its data directory. The image's data directory belongs to that user, and Docker gives an empty named volume the same owner, so the entrypoint skips the `chown` and user switch that need capabilities. When an image still fails on a permission, its log says `Operation not permitted` and names no capability. Add back, as one fix, the set a root entrypoint that switches user needs (`CHOWN`, `DAC_OVERRIDE`, `FOWNER`, `SETUID`, `SETGID`), and list them in the README. Keep the sum of `mem_limit` under `docker info --format '{{.MemTotal}}'`.

## Copy images

Each copy's image, shared by its install step and its services, is a development image: the stack's toolchain, a non-root user, no project code.

```dockerfile
FROM <toolchain image>:<version>
ARG UID=1000
ARG GID=1000
RUN <install curl, git, ca-certificates> \
 && <create or rename a user "sandbox" with UID and GID, home /home/sandbox> \
 && mkdir -p <each cache dir under /home/sandbox> \
 && chown -R "${UID}:${GID}" /home/sandbox
USER sandbox
WORKDIR /work/<repo>
```

Create every directory that a named cache volume mounts over, such as `/home/sandbox/.m2` or `/home/sandbox/go/pkg`, owned by `sandbox`. Docker gives an empty named volume the owner of the image directory it mounts over, and creates a missing directory as root, which the `sandbox` user cannot write.

Take `<version>` from the copy's own files (`.nvmrc`, `engines`, `.python-version`, `requires-python`, `.java-version`, `go.mod`, `rust-toolchain.toml`), else the stack's current LTS. When the base image already has a user at that UID, such as `node`, rename it. When it already has a group at that GID, make that group `sandbox`'s primary group instead of creating one. On macOS `id -g` is 20 (`staff`), which is `dialout` in Debian and Alpine. Write `UID` and `GID` from `id -u` and `id -g` into `.env`.

## gitread image

The one image that runs git on a `.git` the source or a container could have written. It runs with no network, every capability dropped and the dev's UID, so a program named in that `.git` runs there and not on the host.

```dockerfile
FROM debian:bookworm-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends git tar ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && git config --system --add safe.directory '*'
```

`safe.directory` goes in the system config because the mounted folders are not owned by the container's user, and a `-c` flag does not reach the `upload-pack` that a local fetch starts.

## Install steps and services

Dependencies install at run time, in a one-shot install step behind the egress proxy, because a `RUN` line in a build cannot be held to the allowlist. Each copy gets one install step and one image, shared by all its services, so two services from one monorepo never install into the same folder at once. Each service waits for its copy's install step and its dependencies:

```yaml
services:
  <repo>-install:
    <<: *hardening
    build: { context: images/<repo>, args: { UID: "${UID}", GID: "${GID}" } }
    command: [<install command>]
    volumes: ["./repos/<repo>:/work/<repo>", "<cache volume>:/home/sandbox/<cache dir>"]
    env_file: [env/<repo>-test.env]
    environment: { <proxy variables> }
    networks: [sandbox, proxy]

  <service>:
    <<: *hardening
    build: { context: images/<repo>, args: { UID: "${UID}", GID: "${GID}" } }
    command: [<development start command>]
    env_file: [env/<service>.env]
    volumes:
      - ./repos/<repo>:/work/<repo>
      - <cache volume>:/home/sandbox/<cache dir>
      - ./env/<service>.env:/work/<repo>/.env:ro
      - ./overrides/<service>/<path>:/work/<repo>/<path>:ro
    depends_on:
      <repo>-install: { condition: service_completed_successfully }
      <dependency>: { condition: service_healthy }
    healthcheck:
      test: ["CMD", "curl", "-sS", "-o", "/dev/null", "http://localhost:<port><health path>"]
      interval: 10s
      retries: 30
    networks: [sandbox]
```

The healthcheck passes on any HTTP answer, a 404 included, so it needs no health endpoint. For a service that does not speak HTTP, install `netcat-openbsd` in its image and use `["CMD", "nc", "-z", "localhost", "<port>"]`.

The copy's tests run in its install step's container (`docker compose run --rm <repo>-install <test command>`). That container reaches the dependencies on `sandbox`, and the registries through the proxy, for the plugins a test runner such as Maven resolves only when tests run. `env/<repo>-test.env` holds the connections the tests read.

Install where the stack's own tooling puts dependencies: a folder in the copy that its `.gitignore` already ignores (`node_modules`, `.venv`), or a named cache volume (`~/.m2`, `~/.gradle`, `~/go/pkg`, `~/.cargo`). Mount the `.env` file only where the copy reads one, and an override only where an environment variable cannot set the value.

A service reaches another service, a dependency or a mock by its compose name: `postgres:5432`, `rs-core:8080`, `binance-mock:8080`.

## Dependencies

Use each dependency's official image, at the version the source names (a Helm chart, a compose file, a doc, a client library's supported range), else its current stable release. Generate each password with `openssl rand -hex 16` into `.env`. Give each one a health check from its own tools: `pg_isready`, `redis-cli ping`, `mysqladmin ping`, `kafka-broker-api-versions.sh`. Publish a dependency's port through `ingress` only when the README tells the dev to use it.

## Mocks

Each mock answers the requests the calling code makes, with dummy data shaped as the code parses it.

- Prefer a stand-in that speaks the real protocol: MinIO for S3, Mailpit for SMTP, LocalStack for other AWS services, a fake OAuth server for an identity provider.
- Otherwise use WireMock, pinned to a version, with one mapping in `mocks/<name>/mappings/` per endpoint the code calls. Build each mapping from the calling code, the client library's types, and an OpenAPI or other spec when the source holds one. A missing repo's mock follows the same rule, from its callers.
- Point the service at the mock through the setting that holds the base URL, in `env/<service>.env` or an override. When the code hard-codes the host, give the mock that host name as a network alias. When it also hard-codes HTTPS, add a sandbox CA to the copy image's trust store and serve a certificate for that name from the mock; when that fails, record the `path:line` as a connection that needs a code change.

A real external host opens only on the dev's request by name. Give that one service a fixed address on `proxy` from `.20` up and the proxy variables, add its block to `egress/squid.conf`, and list it in the README. Leave `allowlist.txt` alone: that list is the install steps'.

## Agent container

```yaml
  agent:
    <<: *hardening
    build: { context: images/agent, args: { UID: "${UID}", GID: "${GID}" } }
    command: ["sleep", "infinity"]
    env_file: [agent.env]
    environment: { <proxy variables>, CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1" }
    volumes: ["./repos:/work", "<each cache volume>:/home/sandbox/<cache dir>"]
    working_dir: /work
    networks:
      sandbox: {}
      proxy: { ipv4_address: <subnet>.10 }
```

Its image holds `git`, `curl`, `ca-certificates`, every toolchain the services use at the same versions, the cache directories as for a copy image, and Claude Code installed as the non-root user with `curl -fsSL https://claude.ai/install.sh | bash`. The agent reaches only the Anthropic API, so it installs no packages. It uses what the install steps put in the copies and the cache volumes. When it changes a manifest, the dev runs `docker compose run --rm <repo>-install`. Write `agent.env` as the one line `CLAUDE_CODE_OAUTH_TOKEN=`, mode 600; the dev fills it with the token `claude setup-token` prints in their terminal. The agent sees every copy at `/work/<repo>`, the same files the services run, so its edits reach the running services without a rebuild.
