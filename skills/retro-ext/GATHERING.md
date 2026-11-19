# Gathering brief

You gather one session into the Retro pool. Your inputs are in your prompt: `Transcript`, `Active skill`, `Workspace`. The pool's format is `agent-rules/retro-pool.md`, two folders above this file's folder; read it first. Your work is done when the pool holds a commit with this session's occurrences, or you found none, and you returned your one line.

## 1. Find the pool

Compute the pool's place from `Workspace` as `retro-pool.md` says under Place. When that folder or its git is missing, write nothing and return `Retro pool missing at <place>.`

## 2. Read the session

1. Read the transcript, a JSON Lines file. The session id is its file name without `.jsonl`.
2. Read every subagent transcript of the session too: each `subagents/agent-*.jsonl` in the folder named like the session id, beside the transcript.
3. Read the active skill's protocol: `.agent-rules/skills/<active skill>.md` in `Workspace`, or the nearest such file above it. Read each extension skill its `with:` line names, in `.agent-rules/dev-skills/skills/<name>/SKILL.md` of `Workspace`.
4. Read the rules the session ran under: `CLAUDE.md` and `AGENTS.md` of `Workspace` and of each repository the session worked in.

## 3. Find occurrences

Find every occurrence of three kinds, in the main transcript and the subagent transcripts:

- **Problem**: something that went wrong in agents' work: an error, a wrong result, a retry, a refusal, a correction by the dev.
- **Good practice**: something that went well and that a later change could lose.
- **Skipped step**: a step of the protocol or a rule that the session did not run. Record it as a problem.

For each, note what happened, its cause, and the step or rule it broke or kept, by its name or first words, or `no rule`.

Count each occurrence once per session:

- A refusal is a tool result that says the permission system or its classifier denied or blocked the call. It counts once, also when a subagent's refusal comes back again inside its parent's Agent result, and when the same call is retried and refused again.
- The same problem in the main transcript and a subagent transcript is one occurrence with the count of both.
- The count is the number of times it happened in this session.

## 4. Match entries

1. Read `index.md`. Read every entry whose state is not `closed`. Leave closed entries unread.
2. An occurrence matches an entry when the entry's What describes the same problem or good practice, of the same kind.
3. A match gets one occurrence line appended under the entry's Occurrences. Change nothing else in it.
4. An occurrence with no match gets a new entry: the next free id, state `gathering`, the entry template filled, its one occurrence line, Fix `none`, `Tokens: none.`, Verdict `none yet`. Add its row to `index.md` in id order.

The occurrence line is the template's line, with `When` as today's date.

## 5. Count clean runs

Each `fixed` entry with no occurrence in this session, whose step or rule this session ran, gets one occurrence line with `Count: 0`. Its How says the step or rule ran without the problem.

## 6. Commit and return

1. In the pool, `git add -A`, then commit with the message `Gather <session id> (<active skill>)`.
2. Return exactly one line, and nothing else: `Retro pool: <n> new, <m> appended, commit <short sha>.` With no occurrence, commit nothing and return `Retro pool: no occurrence.`
