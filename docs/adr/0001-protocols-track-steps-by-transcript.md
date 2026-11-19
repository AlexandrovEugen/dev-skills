---
status: accepted
---

# Protocols track steps by the transcript

A protocol lists its skill's steps, each with a completion criterion that a script can see in the transcript. The protocol hook finds the current step from those criteria, loads only that step's text on each prompt, and loads the next step's text when its criterion appears after a tool call. A side quest called inside a stage keeps that stage's protocol in force. Agents write no step markers.

- **Ruled:** dev-skills has one objective, every skill run as planned with minimal drift of agent prediction. Steps and stages are tracked, no step is skipped, and each skill runs from start to end. Information arrives at its step: an end step is not loaded at the start. Side quests are expected inside a stage.
- **Derived:** a step the agent states is a prediction and can drift, so criteria come from the transcript, which the hook already reads to find active skills. A typed side quest replaced the stage's protocols, so a side quest must keep them.

## Considered options

- A Stop hook that starts work: a new hook role, where every hook so far informs, injects, guards or checks.
- A protocol line loaded on every prompt: paid in tokens during all the work for a step that runs at the end.
- Steps tracked only at a skill's edges: end steps would load at the start.
