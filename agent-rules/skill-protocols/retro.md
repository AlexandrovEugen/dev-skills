<!-- managed by dev-skills: agent-rules/skill-protocols/retro.md -->
---
skill: retro
scope: session
with: [retro-ext@gather]
---
# retro

Run the steps in order. Each step is done only at its criterion. The Retro pool's format is `agent-rules/retro-pool.md` in the workspace's pinned copy, `.agent-rules/dev-skills/`; its Place, Verdict, Tokens and Judgement sections rule every step. Until the dev accepts, the retro changes nothing.

## Step: gather
done: Agent prompt ~ GATHERING\.md
1. The first tool call is the Skill tool for `writing-for-agents`.
2. Run `retro-ext` with the active skill `retro`. This retro's problems come from that gathering, not from recall.

## Step: read
done: Bash command ~ git show --format= --name-only
Wait for the gathering's one line. With `Retro pool: no occurrence.`, tell the dev the session gathered nothing; the retro ends there.

Otherwise read the entries of that line's commit, and only those, in one Bash call:

```
cd <pool> && git show --format= --name-only <commit> | grep -v '^index.md$' | xargs cat
```

## Step: present
done: Write file_path ~ /\d{4}-[^/]+\.md$
1. Present each problem entry read as a candidate, in severity order. Each candidate shows its title, state, verdict line by the format's Verdict section, and a proposed fix in the retro skill's categories.
2. Propose good practices only when the dev calls the judge: then list each gathered good-practice entry and each fixed problem that meets the format's graduation rule, for the dev to accept or reject one by one.
3. Stop and wait for the dev's judgement. Change no file, in the pool or elsewhere.
4. When the dev judges, rewrite each judged entry whole with the Write tool, as the format's Judgement section says.

## Step: change
1. Make each change the dev accepted, and no other.
2. For each fix, write its `Tokens:` line in its entry, counted by the format's Tokens section before and after the change, and set the entry's state to `fixed`.
3. Commit in the pool with the message `Judge <session id>`.
