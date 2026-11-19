---
status: accepted
---

# The Retro pool is a local git folder beside the workspaces

Problems and good practices gathered from sessions stay in one Retro pool outside every repository. The pool is a folder named `retro-pool` in the workspaces' parent folder. It is its own local git repository with no remote. The mechanism that triggers the gathering also stores it: the end step of a session skill's protocol, loaded by the protocol hook (ADR 0001), runs `retro-ext`, and its one gathering sub-agent writes the entries into the pool and commits them. Gathering and retros compute the pool's place from the workspace path when they run. A workspace in another parent folder keeps a setting in its personal settings that points to the pool. dev-skills holds the pool's format, the gathering brief and the protocols, never the pool's data.

- **Ruled:** statistics from sessions are not published to the public dev-skills repository. Setup gives the pool a local place, and gathering and retros read and write it there. That place is one folder beside the workspaces, in their parent folder by default. A general rule gives the place relative to the workspace; no copied path is used. The pool keeps its history in git. The mechanism that triggers the gathering also stores it in the pool. A workspace in another parent folder points to the pool through a personal setting.
- **Derived:** one pool serves every registered workspace, because a retro reads the history of all of them. The pool has no remote, because it is local and private. The format is public and the data is local, because only the data is private.

## Considered options

- Send pool entries to dev-skills by `/workspace push`: this publishes private statistics in a public repository.
- A git-ignored folder inside dev-skills: private data inside a public repository, where one wrong ignore line publishes it.
- A location stored once next to the registry and copied into every workspace by sync: a stored path where a general rule is enough.
