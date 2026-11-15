# Report format

Fill every `<…>`. IDs run `M1`, `M2`… for Must Fix, `S1`… for Should Fix, `C1`… for Could Fix. Order each bucket by impact: findings that risk secrets, data or money first, then those that stop a service, then the rest; within each, the one that reaches more users or callers first. A bucket with no findings keeps its heading, with the line `None.` under it. Write the **Issue** line only for a finding an open issue already reports. `<repository>` is `owner/repo` from the `origin` remote, else the repository root's folder name.

```markdown
# Deep review: <repository>[/<target path>]

Commit `<sha>`, `<sha> + uncommitted changes` or `no git` · <YYYY-MM-DD> · <n> parts · <m> Must Fix · <s> Should Fix · <c> Could Fix · <d> dropped by verification

## 1. Architecture

<The pattern, in two or three sentences.>

**Strengths**
- <strength> (`<path>`)

**Weaknesses**
- <weakness> (`<path>`)

## 2. Backlog

### 🔴 Must Fix

#### M1. <name>
- **Location:** `<path>:<line>`
- **Dimension:** <dimension>
- **Failure scenario:** <inputs> → <wrong output>
- **Impact:** <what breaks, for whom>
- **Fix:**
  1. <step>
- **Done when:** <check>
- **Issue:** #<number>

### 🟡 Should Fix

#### S1. <name>
<the same fields as Must Fix>

### 🟢 Could Fix

- **C1.** <what to change> (`<path>:<line>`)

## 3. Coverage

| Part | Paths | Files | Read in full | Lines |
|---|---|---|---|---|
| <part> | `<paths>` | <files> | <files read in full> | <lines> |

Not read in full: <path, comma-separated, or none>.

Rule sources: `<path>`, `<path>`. Dimensions skipped: <dimensions and why, or none>. Issues: <matched against <n> open issues, or not matched: reason>.
```
