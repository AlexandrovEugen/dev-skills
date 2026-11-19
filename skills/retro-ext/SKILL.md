---
name: retro-ext
description: Extension of session skills. At a skill's end step, gathers the session's problems and good practices into the Retro pool. Runs at the end step of a protocol that names it; never alone.
---

# retro-ext

Adds a gathering to the end step of the skill whose protocol names it. Removes none of its steps.

1. Start one sub-agent with the Agent tool. Its prompt is these four lines, filled in:

   ```
   Read GATHERING.md in <this skill's folder> and run it.
   Transcript: <transcript-path>
   Active skill: <the skill whose end step named retro-ext>
   Workspace: <the nearest folder at or above this session's working folder that holds .agent-rules/>
   ```

   This skill's folder is the folder of the `SKILL.md` named in this section's header.
2. Read nothing more of the gathering. Show the dev the sub-agent's one line as it came back.
