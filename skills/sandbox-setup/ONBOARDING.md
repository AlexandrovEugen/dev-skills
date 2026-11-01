# Onboarding skill

An interactive skill, written for this one project, that onboards the dev step by step: one **case** at a time, followed through the running sandbox, until they can trace the project's pipeline and flow alone.

## What to gather

From the inventory and the code, list the project's **cases**: each thing a user or a scheduler makes the system do, such as *a user places an order* or *the nightly job recomputes prices*. For each case, record its path through the system: the entry point, each service, dependency and mock it touches in order, each `path:line` that moves it on, and the data it leaves behind. Order the cases from the one that touches the fewest services to the one that touches the most.

**Done when** every service appears in at least one case, and every step of every case cites a `path:line`.

## What to write

Write `<sandbox>/.claude/skills/onboard-<project>/SKILL.md`, with `CASES.md` beside it holding the cases. Its frontmatter sets `disable-model-invocation: true` and a one-line description. Its body tells the agent running it to:

1. Open with the project's purpose and a map of its services, dependencies and mocks, in five lines at most.
2. Take the cases in order, one per round. In each round, show the case's next step: the file and lines that do it, and a live probe of the sandbox that makes it visible, such as a `curl` to the ingress port, a query to the database, or a `docker compose logs` line. Then ask the dev one question whose answer predicts the step after.
3. Correct a wrong prediction from the code, then move on. Let the dev ask to slow down, skip ahead, or open any file.
4. End a case by asking the dev to trace it back in their own words, then offer the next one.

Probe with what a user can do and what an operator can read: requests through the ingress ports, `SELECT` queries and logs. The copies stay as the onboarding found them.

Add one line to the sandbox README, under **Work on it with an agent**: `For a guided tour, run claude in <sandbox path> and type /onboard-<project>.`
