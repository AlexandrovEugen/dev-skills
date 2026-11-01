---
name: deep-review
description: Review a whole repository, or one directory of it, for bugs, security holes and debt, verify every finding against the code, and write a Must / Should / Could Fix backlog.
disable-model-invocation: true
---

# Deep review

Review one target in full: every file read, every finding verified, every verified finding in the backlog. Leave the target's code, tickets and labels unchanged; the one file this skill writes is the report.

## Findings

A **finding** is one problem at one place in the code. Every Must Fix and Should Fix finding carries these fields:

- **Name**: the problem in a few words.
- **Location**: `path:line`, a line read in this run.
- **Dimension**: one of the seven below.
- **Failure scenario**: concrete inputs → the wrong output, crash or leak they cause. Example: `POST /orders` with `quantity=0.5` → the row stores `5.0`.
- **Impact**: what breaks, for whom.
- **Fix**: short numbered steps.
- **Done when**: a check anyone can run. Example: a test posts `quantity=0.5` and the row holds `0.5`.

A Could Fix finding is one line: what to change, and its `path:line`.

### Buckets

- **Must Fix**: data, money, a secret or a running service is at risk now. Wrong output on a production path, a leaked key, an injection, a crash at startup, lost data.
- **Should Fix**: nothing breaks today, and the code is debt: untested behaviour, a race that needs rare timing, a slow path on real load, a breach of the target's own standards or ADRs.
- **Could Fix**: a small cleanup: naming, dead code, a minor optimisation.

A finding with no failure scenario is Could Fix at most.

### Dimensions

1. **Correctness**: wrong results, unhandled errors, broken edge cases.
2. **Security**: secrets in code or logs, injection, missing auth, unsafe deserialisation. Where the target serves HTTP, check the OWASP Top 10.
3. **Concurrency**: races, shared mutable state, async calls left unawaited, deadlocks, missing timeouts.
4. **Performance**: work repeated per item, unbounded growth, blocking calls on hot paths.
5. **Test coverage**: behaviour on a production path that no test exercises.
6. **Standards**: breaches of the target's documented coding standards, each citing the rule.
7. **Decisions**: code that contradicts the target's ADRs or misuses its glossary terms, each citing the ADR or entry.

Skip 6 and 7 when the target documents nothing for them. Skip what a linter or formatter configured in the target already enforces.

## Steps

### 1. Pin the target

The target is the repository or directory the dev named. With no target, ask for one. Record the repository root, the target path inside it, and `git rev-parse HEAD`.

### 2. Read the target's rules

Find and read every file that says how code there is written or decided: `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`, `CODING_STANDARDS.md`, the docs they point to, `docs/adr/`, `GLOSSARY.md` or `CONTEXT.md`, and the tracker setup they name. Done when you hold a list of these paths, the **rule sources**, and know whether the target serves HTTP.

### 3. Map the parts

Split the target into at most 8 **parts** along its top-level modules or directories, grouping small ones together. Leave out vendored code, generated code, lockfiles and build output. Done when every remaining source and test file belongs to exactly one part, and each part has its paths, file count and line count.

### 4. Review each part

Dispatch one sub-agent per part, all in one message, in the foreground. Each brief carries:

- the part's paths, the repository root and the commit;
- the rule sources' paths;
- the whole **Findings** section above, pasted in full;
- the task: read every file in the part in full; check all seven dimensions; return every finding with its fields, a three-sentence account of what the part does and how it is built, and a list of **leads**: calls into other parts whose behaviour looks wrong from this side.

### 5. Read across the parts

From the parts' accounts and leads, work out the target's architecture: its pattern, its strengths and its weaknesses, each citing files. Open the code behind each lead. Add the findings that only show across parts: circular dependencies, one rule applied two ways, an error swallowed at a boundary.

### 6. Verify

Split the Must Fix and Should Fix findings across at most 4 sub-agents, dispatched in one message. Each one tries to **disprove** every finding it holds: it reads the cited code and its callers, and may run the target's existing tests. It returns one verdict per finding:

- **confirmed**: the failure scenario follows from the code;
- **moved**: the problem is real and belongs in another bucket; give the bucket;
- **disproved**: the code does not do what the finding claims; drop it.

Done when every Must Fix and Should Fix finding has a verdict. Count the dropped ones for the report.

### 7. Match open issues

List the target repository's open issues with `gh issue list --state open --limit 500 --json number,title,body`. Give each finding that an open issue already reports that issue's number.

### 8. Write the report

Write `docs/reviews/<YYYY-MM-DD>-deep-review.md` at the repository root, in the form [REPORT-FORMAT.md](REPORT-FORMAT.md) gives, with a `-2`, `-3` suffix when the name is taken. Leave it uncommitted.

### 9. Summarise and offer the issues

Tell the dev, in chat: the report's path, the count per bucket, the dropped count, and each Must Fix finding in one line with its ID. Offer to file the findings the dev picks as issues. On the dev's yes to named IDs, file each one the way the target's tracker setup says, or with `gh issue create` when it says nothing: the finding's name as the title, its fields as the body. Offer no finding that already has an issue number.
