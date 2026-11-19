<!-- managed by dev-skills: agent-rules/skill-protocols/diagnosing-bugs.md -->
---
skill: diagnosing-bugs
with: [retro-ext@gather]
---
# diagnosing-bugs

Run the skill's phases in order. Each phase is done only at its criterion. Every command, output and artifact shown has its secrets redacted.

## Step: cleanup
done: Bash command ~ git commit|gh pr (create|edit)
1. **Build a feedback loop**: done when one tight, red-capable command was run and its redacted invocation and output were shown, or the dev was told that no loop could be built, with what was tried.
2. **Reproduce and minimise**: done when the loop goes red on the dev's exact symptom across runs, and every remaining element is load-bearing.
3. **Hypothesise**: done when 3 to 5 ranked, falsifiable hypotheses, each with its prediction, were shown to the dev.
4. **Instrument**: done when each probe maps to one prediction, and every debug log carries a `[DEBUG-...]` prefix.
5. **Fix and regression test**: done when the regression test failed before the fix and passes after it at a correct seam, or the missing seam is noted, and the Phase 1 loop ran again on the original scenario.
6. **Cleanup**: done when every item of the skill's cleanup checklist holds: the original repro no longer reproduces, the regression test passes or the missing seam is documented, no `[DEBUG-...]` line is left, throwaway prototypes are deleted or moved, and the commit or PR message states the hypothesis that proved correct.

## Step: gather
After the commit or PR that closes the cleanup checklist, run `retro-ext` with the active skill `diagnosing-bugs`. The session ends with its one line.
