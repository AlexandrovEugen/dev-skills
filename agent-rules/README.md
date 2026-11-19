# Agent rules

This folder is the single source of the shared rules that the `workspace` skill installs into every workspace. A workspace runs them from its pinned copy, `.agent-rules/dev-skills/`, which the `workspace` skill extracts from `origin/<default>`. Hooks never run from this working tree, so its branch and local changes reach no workspace.

## Universal rules

`UNIVERSAL.md` is the source of the root `AGENTS.md` that the `workspace` skill installs; the root `CLAUDE.md` is a symbolic link to it. It imports the workspace's own `WORKSPACE.md`, which `templates/WORKSPACE.md` starts.

## Protocols

`skill-protocols/` holds one protocol per skill: `domain-modeling`, `diagnosing-bugs`, `grill-with-docs`, `grilling`, `implement`, `implement-spec`, `prototype`, `research`, `retro`, `to-tickets`, `triage` and `wait-what`.

- A protocol holds only checks that its skill is called and run as written: the Skill tool calls it makes, a check per step or format of the skill, and the skill's own end.
- Behaviour the skill lacks goes into an extension skill, `skills/<name>-ext/`, never into a protocol or a rule. A skill the dev does not own stays unedited.
- The first line is the marker `<!-- managed by dev-skills: agent-rules/skill-protocols/<name>.md -->`, which tells a managed copy from a workspace's own file.
- The header between `---` lines holds `skill:`, an optional `kind: side-quest`, and an optional `with:` list of companions. A companion is another skill's protocol or an extension skill; the hook adds each one with the protocol.

## Stages and side quests

A skill typed by the dev starts a new stage: its protocols replace the active set. A skill called with the Skill tool joins the stage. A protocol whose header holds `kind: side-quest` marks its skill as a side quest: typed inside a stage, it keeps the stage's protocols and extension skills in force, on that prompt and on later ones, and its own protocol joins them. `prototype`, `research` and `wait-what` are side quests.

## Step loading

A protocol whose body holds `## Step: <name>` lines loads one step at a time. A protocol with none loads whole.

- The line after `## Step: <name>` is the step's completion criterion. `done: <Tool>` is met by any call of that tool. `done: <Tool> <input field> ~ <regex>` is met by a call whose input field matches the JavaScript regex, for example `done: Bash command ~ gh issue create`.
- Give every step a criterion except the last. A step without one stays current until its stage ends.
- Give each step of the skill its own `## Step:` when a tool call marks it. Keep a step that no tool call marks in the step that follows it.
- The current step is the first step whose criterion no tool call has met after the call that met the step before it; for the first step, after its stage started.
- On each prompt, the hook injects the text above the first step plus the current step. After a tool call that meets the current step's criterion, it injects the next step.
- The hook reads steps from the transcript alone, so agents write no step markers.
- `<extension>@<step>` in `with:` ties an extension skill to one step: its text loads with that step and is absent at every other step. List it once per step to tie it to several, for example `with: [retro-pool-ext@read, retro-pool-ext@change]`.

## Hooks and settings

`platforms/` holds settings fragments. The `workspace` skill merges a fragment only where the platform supports it, into the workspace's personal settings (`.claude/settings.local.json` for Claude Code), and keeps workspace-owned settings. Its `<pinned>` placeholder stands for the pinned copy.

`platforms/claude-code.json`:

- Denies `AskUserQuestion` and `mcp__ccd_turn__wrap_up`, a personal preference of the dev, which is why the fragment goes into personal settings. Agents ask in plain chat.
- Runs `hooks/skill-protocol.mjs` on every prompt and after every call of a tool its PostToolUse matcher names. The matcher is exactly `Skill` plus each tool a step criterion names; a test fails when they differ. The script adds the protocols of the session's active skills from each `.agent-rules/skills/` between the session's folder and `/`, the nearest one winning per skill, and the extension skills from `skills/`. It writes the session's transcript path where an injected text holds `<transcript-path>`. Test it with `node --test agent-rules/hooks/skill-protocol.test.mjs`.
- Runs `hooks/steering-changed.mjs` at session start and on every prompt. It names the steering files and the repositories' `AGENTS.md`, `CLAUDE.md` and `GLOSSARY.md` that changed on disk since the session last checked. Test it with `node --test agent-rules/hooks/steering-changed.test.mjs`.
- Runs `hooks/no-host-paths.py` before every write and command. It blocks a path of the dev's machine from entering a repository of the workspace. Test it with `python3 -I agent-rules/hooks/no-host-paths.test.py`.
- Runs `hooks/grill_round_check` at Stop. It blocks a turn whose grill round breaks the format of `grilling` and `grilling-ext`. It finds a re-asked question by its title in the grill's earlier turns and compares its text after the `❓ **Qn**` tag with that last ask, whitespace collapsed and its `Checked:` and `Rewritten:` lines left out. A question that differs passes only with a `Rewritten:` line that differs from the one of the last ask. Test it with `cd agent-rules/hooks && uv run --with pytest python -m pytest`.

## Retro pool

`retro-pool.md` is the format of the Retro pool: its place, layout, index, states, entry template, verdict, token count and judgement. The pool holds every problem and good practice gathered from sessions, one entry each, and a retro draws on it.

- The pool is one folder, `retro-pool`, in the workspaces' parent folder, with its own local git and no remote. A workspace in another parent folder names it in `env.RETRO_POOL` of its personal settings.
- The `workspace` skill's setup and sync create the pool when it is missing. The pinned copy carries the format to every workspace.
- The pool's data stays on the dev's machine. Only its format lives here.

## Gathering: `retro-ext`

`retro-ext` (`skills/retro-ext/`) gathers a session into the Retro pool. It names no skill, so any session skill's protocol ties it to its end step: `to-tickets`, `implement`, `implement-spec`, `triage` and `diagnosing-bugs` each end with `with: [retro-ext@gather]`, so its text loads only after the step before is done.

- Its text tells the agent to start one gathering sub-agent with the transcript path, the active skill and the workspace, and to show the dev the one line it returns.
- The gathering brief, `skills/retro-ext/GATHERING.md`, is read only by that sub-agent; it is never injected. The sub-agent reads the transcript and its sub-agent transcripts, records each problem, good practice and skipped step as an occurrence, appends it to a matching entry that is not closed or creates a new entry, gives each fixed entry whose step or rule the session ran cleanly a `Count: 0` occurrence, and commits in the pool.

## Retro: `retro-pool-ext`

The `retro` protocol works from the Retro pool in five steps:

1. `style` calls `writing-for-agents`.
2. `gather` runs `retro-ext` on the retro's own session.
3. `read` reads only the entries of the gathering's commit.
4. `present` shows them with their verdicts and waits for the dev's judgement; it is done when the pool records that judgement.
5. `change` makes the accepted changes, rewrites the judged entries compact, and commits in the pool.

`retro-pool-ext` (`skills/retro-pool-ext/`) is tied to `read`, `present` and `change`. It holds how the retro reads the commit's entries, records the judgement in each entry's state, counts each fix's tokens, rewrites the entries and commits.

## Other files

- `steering/` holds what steering needs: `exclude`, the allow-list of the workspace's own files; `exclude-folder-root`, the folders added when the workspace root is not a repository; and `steering`, the git wrapper copied to `.agent-rules/steering`.
- `workspaces.local.tsv` lists the workspaces registered on this machine for `sync`, one per line: the workspace name, a tab, its absolute path. Git ignores it, so personal paths stay out of the repository.
- `tools/token-limit-check.sh` is a pre-commit check a repository can install: it blocks a staged file over 5,000 tokens and says how to split it.
