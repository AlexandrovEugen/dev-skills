<!-- managed by dev-skills: agent-rules/skill-protocols/retro.md -->
---
skill: retro
with: [retro-ext@gather, retro-pool-ext@read, retro-pool-ext@present, retro-pool-ext@change]
---
# retro

Run the steps in order. Each step is done only at its criterion. The Retro pool's format is `agent-rules/retro-pool.md` in the workspace's pinned copy, `.agent-rules/dev-skills/`; its Place, States, Verdict, Tokens and Judgement sections rule every step.

## Step: style
done: Skill skill ~ writing-for-agents
1. Call the Skill tool with `writing-for-agents`.

## Step: gather
done: Agent prompt ~ GATHERING\.md
2. Run `retro-ext` with the active skill `retro`. This retro's problems come from that gathering, not from recall.

## Step: read
done: Bash command ~ git show --format= --name-only
Wait for the gathering's one line. With `Retro pool: no occurrence.`, tell the dev the session gathered nothing; the retro ends there. Otherwise read the entries of that line's commit, and only those, as `retro-pool-ext` says.

## Step: present
done: Edit file_path ~ /\d{4}-[^/]+\.md$
3. Present each problem entry read as a candidate, in severity order. Each candidate shows its title, state, verdict line by the format's Verdict section, and a proposed fix in the retro skill's categories.
4. Propose good practices only when the dev calls the judge: then list each gathered good-practice entry and each fixed problem that meets the format's graduation rule, for the dev to accept or reject one by one.
5. Stop and wait for the dev's judgement. Done when the pool records that judgement, as `retro-pool-ext` says.

## Step: change
6. Done when each change the dev accepted, and no other, is made; each judged entry is rewritten compact by the format's Judgement section, each fix with its `Tokens:` line and state `fixed`; and the pool holds one commit of them, as `retro-pool-ext` says.
