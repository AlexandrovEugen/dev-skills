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
A skill the dev owns that adds steps or formats to one skill the dev does not own, and runs together with it. It never removes a step of that skill.
_Avoid_: patch, override, workaround

**Push**:
Sending a change of the shared rules from one workspace back to their single source, for review.
_Avoid_: promote, upload

**Sync**:
Bringing every registered workspace up to date with the shared rules after a pushed change is accepted.
_Avoid_: sync-all, distribute
