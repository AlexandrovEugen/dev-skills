# dev-skills

The dev's own skills and the shared rules that every workspace receives from one place.

## Language

**Workspace**:
A folder that groups the repositories the dev works on together, and holds the rules shared above them.
_Avoid_: project, umbrella

**Setup**:
Creating one complete workspace: its rules, settings, skills, protocols, checks, and file layout.
_Avoid_: pull, install

**Steering**:
The local version history of a workspace's own files: its rules, docs, and tooling, apart from the repositories it holds. Setup creates it first.
_Avoid_: backup, workspace repo

**Extension skill**:
A skill the dev owns that adds steps or formats to one or more skills the dev does not own, and runs together with each. It never removes a step of those skills.
_Avoid_: patch, override, workaround

**Push**:
Sending a change of the shared rules from one workspace back to their single source, for review.
_Avoid_: promote, upload

**Sync**:
Bringing every registered workspace up to date with the shared rules after a pushed change is accepted.
_Avoid_: sync-all, distribute

**Step**:
One ordered action of a skill, as the skill itself names it, ending on a condition that tells it is done.
_Avoid_: task

**Stage**:
The part of a session that one invoked skill runs, from its call until another skill takes the session over or the session ends. A stage holds that skill's steps.
_Avoid_: phase

**Side quest**:
A skill called inside a stage to clear a doubt or gather facts, after which the stage goes on at the step it left.
_Avoid_: detour, interruption

**Protocol**:
The ordered steps a skill must run without skipping, with a way to verify that no step or rule of that skill was skipped.
_Avoid_: checklist, procedure

**Problem**:
Something that went wrong in agents' work, kept across retrospectives with a count of how often it happened in each run.
_Avoid_: candidate, finding

**Good practice**:
Something that went well in agents' work, kept across retrospectives so that its loss after a change shows.
_Avoid_: keep, win

**Retro pool**:
The store of every problem and good practice gathered from sessions, one entry each, that a retrospective draws on to propose a fix.
_Avoid_: concern pool, memory
