# Self-improving sessions: primary sources

Goal: score each session automatically, keep problems and good practices, and judge each fix on quality and on token cost.

## 1. Automatic analysis at session end

**SessionEnd hook.** It fires when a session ends, with `session_id`, `transcript_path` and a `reason` (`clear`, `resume`, `logout`, `prompt_input_exit`, `other`) ([hooks](https://code.claude.com/docs/en/hooks#sessionend)). It cannot block the end. Its default budget is 1.5 s, and a per-hook `timeout` raises it to at most 60 s ([hooks](https://code.claude.com/docs/en/hooks#sessionend)). Work longer than that must start a fully detached process ([hooks](https://code.claude.com/docs/en/hooks#run-hooks-in-the-background)).

**Stop and SubagentStop hooks.** Stop fires when Claude finishes a turn; it can block and send Claude back to work ([hooks](https://code.claude.com/docs/en/hooks)). SubagentStop gives `agent_transcript_path`, the sub-agent's own file in a `subagents/` folder, and `last_assistant_message` ([hooks](https://code.claude.com/docs/en/hooks#subagentstop)).
**Headless mode.** `claude -p --output-format json` returns `total_cost_usd`, a per-model cost breakdown and `session_id` ([headless](https://code.claude.com/docs/en/headless)). `--json-schema` returns a schema-checked `structured_output` field ([headless](https://code.claude.com/docs/en/headless)). `--bare` skips CLAUDE.md, hooks, skills and plugins, so a judge run is reproducible ([headless](https://code.claude.com/docs/en/headless)).

**OpenTelemetry.** `claude_code.token.usage` splits `input`, `output`, `cacheRead` and `cacheCreation`; `claude_code.cost.usage` is in USD ([monitoring](https://code.claude.com/docs/en/monitoring-usage)). Both carry `skill.name`, `agent.name` and `query_source` (`main`, `subagent`) ([monitoring](https://code.claude.com/docs/en/monitoring-usage)). Events include `api_error`, `tool_result` (with `success`, `error_type`) and `tool_decision` (accept or reject) ([monitoring](https://code.claude.com/docs/en/monitoring-usage)). Cost is an estimate ([monitoring](https://code.claude.com/docs/en/monitoring-usage)).

**Built-in commands.** `/usage` shows session tokens, cache hit share and cache misses with a likely cause ([costs](https://code.claude.com/docs/en/costs)). On a plan, it attributes usage to skills, sub-agents and MCP servers and suggests trims such as a large CLAUDE.md ([costs](https://code.claude.com/docs/en/costs)). `/insights` reads up to 200 unseen local sessions and reports friction points such as misunderstood requests ([costs](https://code.claude.com/docs/en/costs)).
## 2. Self-improvement loops

**Reflexion.** The agent writes a verbal reflection after feedback and stores it in an episodic buffer ([arXiv:2303.11366](https://arxiv.org/abs/2303.11366)). The buffer holds 1 to 3 reflections to fit the context limit ([arXiv:2303.11366](https://arxiv.org/html/2303.11366)). Evaluators are exact match, fixed heuristics (e.g. a repeated action over 3 cycles), an LLM judge, or unit tests ([arXiv:2303.11366](https://arxiv.org/html/2303.11366)). There is no scoring of lessons over time.

**ExpeL.** An LLM compares a failed and a successful trajectory, or reads a list of successes ([arXiv:2308.10144](https://arxiv.org/html/2308.10144)). It can ADD, EDIT, UPVOTE or DOWNVOTE an insight ([arXiv:2308.10144](https://arxiv.org/html/2308.10144)). A new insight starts at count 2; it is removed at count 0 ([arXiv:2308.10144](https://arxiv.org/html/2308.10144)).

**ACE.** A Generator runs, a Reflector draws lessons from successes and errors, and a Curator writes small delta entries ([arXiv:2510.04618](https://arxiv.org/html/2510.04618)). Each bullet has an ID and helpful and harmful counters ([arXiv:2510.04618](https://arxiv.org/html/2510.04618)). Deltas merge by deterministic code, not by an LLM rewrite ([arXiv:2510.04618](https://arxiv.org/html/2510.04618)). Embedding de-duplication prunes, after each delta or only when the context limit is hit ([arXiv:2510.04618](https://arxiv.org/html/2510.04618)). Full rewrites risk brevity bias and context collapse ([arXiv:2510.04618](https://arxiv.org/abs/2510.04618)). ACE needs a strong Reflector and reliable feedback ([arXiv:2510.04618](https://arxiv.org/html/2510.04618)).

**Dynamic Cheatsheet.** A curator keeps short, transferable snippets, not transcripts ([arXiv:2504.07952](https://arxiv.org/abs/2504.07952)). It removes entries it judges wrong, with no counters or size cap ([arXiv:2504.07952](https://arxiv.org/html/2504.07952)). Faulty heuristics in memory get amplified ([arXiv:2504.07952](https://arxiv.org/html/2504.07952)).

**Voyager.** A skill is code, added only after self-verification confirms success ([arXiv:2305.16291](https://arxiv.org/html/2305.16291)). Only the top 5 skills by description embedding enter the prompt ([arXiv:2305.16291](https://arxiv.org/html/2305.16291)).

**Anthropic on context.** Aim for "the smallest possible set of high-signal tokens" ([context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)). Prefer a few canonical examples over a list of edge-case rules ([context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)).

**Anthropic on evals.** Prefer code graders; calibrate model graders against humans ([evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)). Start with 20 to 50 tasks from real failures ([evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)). A capability eval with a high pass rate graduates into a regression suite ([evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)). Test where a behaviour should and should not occur ([evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)). Track tokens and cost per task ([evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)).

## 3. Extracting good practices

ExpeL extracts insights from lists of successful trajectories alone ([arXiv:2308.10144](https://arxiv.org/html/2308.10144)). Agent Workflow Memory turns trajectories an LLM judge labels successful into reusable workflows ([arXiv:2409.07429](https://arxiv.org/html/2409.07429)). Voyager stores only verified successes ([arXiv:2305.16291](https://arxiv.org/html/2305.16291)). ACE's Reflector reads successes too, and the helpful counter marks bullets that worked ([arXiv:2510.04618](https://arxiv.org/html/2510.04618)).
## 4. Trace evaluation in observability tools

LangSmith online evaluators score production traces with filters and a sampling rate ([LangSmith](https://docs.langchain.com/langsmith/online-evaluations)). Braintrust scoring rules run scorers on traces after a trace goes idle, with sampling, and can rewind to re-score past logs ([Braintrust](https://www.braintrust.dev/docs/evaluate/score-online)). Langfuse links traces to prompt versions and shows per-version median cost, tokens, latency and score ([Langfuse](https://langfuse.com/docs/prompt-management/features/link-to-traces)).
## 5. Token cost of instructions

CLAUDE.md loads at every session start; skills load only when invoked ([costs](https://code.claude.com/docs/en/costs)). At start, only a skill's name and description load, truncated at 1,536 characters ([skills](https://code.claude.com/docs/en/skills)). An invoked skill stays in context for the rest of the session ([skills](https://code.claude.com/docs/en/skills)). After compaction, each skill keeps its first 5,000 tokens within a 25,000 total ([skills](https://code.claude.com/docs/en/skills)). The count-tokens endpoint is free and counts system, tools and messages ([token counting](https://platform.claude.com/docs/en/build-with-claude/token-counting)). Count per target model; newer tokenizers give about 30% more tokens ([token counting](https://platform.claude.com/docs/en/build-with-claude/token-counting)). Cache writes cost 1.25x (5 min) or 2x (1 h); cache reads cost 0.1x or less ([prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)). A change to tools invalidates the whole cache; a change to system invalidates system and messages ([prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)). So editing a rule file costs one full cache write, then cheap reads.

## Mapping to the model

| Element | Relation | What it would add |
|---|---|---|
| SessionEnd hook + detached `claude -p` | Adds | Runs detectors on every session with no manual start |
| SubagentStop `agent_transcript_path` | Matches | Sub-agent transcripts as separate files |
| OTel / JSONL token split | Matches | Cost per session, per skill, per sub-agent |
| `/insights` | Adds | Free friction categories to seed new problems |
| Script detector, judge fallback | Matches | Reflexion and Anthropic graders use the same order |
| Fixed judge prompt | Adds | Calibrate the judge against hand labels first |
| Count per run, compare to previous | Matches | Same as a regression eval |
| Count per run, compare to previous | Adds | Normalise by session count; use pass^k for noise |
| One file per problem, rewritten | Conflicts (partly) | ACE warns full rewrites cause context collapse; edit by delta |
| Helpful/harmful counters | Adds | Score each rule by sessions it helped or hurt |
| Prune at zero (ExpeL) | Adds | Retire stale problems and rules by a rule, not by hand |
| Good practices kept | Matches | ExpeL, AWM, Voyager extract from successes |
| Fix cost = rule text tokens | Matches | Count with the free endpoint |
| Fix cost = rule text tokens | Adds | Weight by load mode: always, on invoke, after compaction |
| Retro only by hand | Conflicts | Sources run evaluation on every trace, sampled |

## Top additions

1. A SessionEnd hook that starts a detached `claude --bare -p` judge with `--json-schema`, writing one count per detector per session.
2. Helpful and harmful counters per rule and per good practice, with removal at zero, as in ExpeL and ACE.
3. Good practices as regression checks: a check that must keep passing, graduated from fixed problems.
4. Cost per rule from the token-counting endpoint, weighted by how often it loads, plus cache writes per edit.
5. A calibration set of 20 to 50 hand-labelled sessions before trusting the judge.

## Where sources are thin

No source measures self-improvement across interactive coding sessions; the papers use benchmarks. No source gives a method to normalise counts across sessions of different length or task. No vendor doc covers judging a rule change in Claude Code by quality and cost together. Good-practice extraction is shown only for task success, not for process habits.
