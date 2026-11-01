# Report format

Fill every `<…>`. IDs run `M1`, `M2`… for Must Fix, `S1`… for Should Fix, `C1`… for Could Fix, most severe first in each bucket. Write the **Issue** line only for a finding an open issue already reports.

```markdown
# Deep review: <repository>[/<target path>]

Commit `<sha>` · <YYYY-MM-DD> · <n> parts · <m> Must Fix · <s> Should Fix · <c> Could Fix · <d> dropped by verification

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

| Part | Paths | Files | Lines |
|---|---|---|---|
| <part> | `<paths>` | <files> | <lines> |

Rule sources: `<path>`, `<path>`. Dimensions skipped: <dimensions and why, or none>.
```
