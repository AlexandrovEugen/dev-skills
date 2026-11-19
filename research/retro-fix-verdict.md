# Retro fix verdict: better, same, worse, or too early

How a later retro judges whether a fix worked, with few sessions.

## 1. Which comparison fits

Use the exact conditional Poisson test on the rates before and after.

- Two Poisson counts with exposures reduce to a binomial test. Condition on the total count. The share of events on the after side is then binomial with p0 = units_after / (units_before + units_after). [R `poisson.test` docs](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/poisson.test.html)
- The exact conditional test is one of four procedures studied for the ratio of two Poisson rates. It is conservative, so it leans toward "no change". [Gu et al. 2008, doi:10.1002/bimj.200710403](https://doi.org/10.1002/bimj.200710403); [statsmodels `test_poisson_2indep`](https://www.statsmodels.org/dev/generated/statsmodels.stats.rates.test_poisson_2indep.html)
- A c-chart uses limits c ± 3√c. Its normal approximation holds only when the mean is at least 5. Below a mean of 9 it has no lower limit. [NIST/SEMATECH e-Handbook 6.3.3.1](https://itl.nist.gov/div898/handbook/pmc/section3/pmc331.htm) So a chart cannot show "better" at these counts. Use it only to view the trend.
- A plain threshold ignores noise. Without a noise model, teams "can't distinguish real regressions from noise". [Anthropic, Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- A Bayesian rate ratio is valid. No source shows it changes the verdict here.

Decision rule in numbers: the rate ratio is RR = rate_after / rate_before. The verdict is "better" when the upper 95% bound of RR is below 1. It is "worse" when the lower bound is above 1.

## 2. Minimum sample before a verdict

- There is no fixed minimum number of data points. Power depends on variability, effect size, and the balance of points before and after. [Bernal et al. 2017, doi:10.1093/ije/dyw098](https://doi.org/10.1093/ije/dyw098)
- A Poisson count is near normal only from a mean of 5. [NIST 6.3.3.1](https://itl.nist.gov/div898/handbook/pmc/section3/pmc331.htm)
- Derived rule: compute E = rate_before × units_after. E is the count the old rate predicts for the after side. If E < 5, the verdict is "too early". With E below 3, even zero events cannot reach p < 0.05, because P(0) = e^-E.
- State it like this: "too early: N units after, the old rate predicts E events, need 5."

## 3. Define "same" as a band

- An equivalence test sets a smallest effect of interest. It concludes "equivalent" only when the whole interval lies inside the bounds. [Lakens 2017, doi:10.1177/1948550617697177](https://doi.org/10.1177/1948550617697177)
- Choose the band before you measure. At these counts, RR in [0.5, 2] is a practical band. It is a judgment, not a sourced value.
- The verdict is "same" when the 95% interval of RR lies inside the band. When the interval crosses 1 and also leaves the band, the verdict is "too early".

## 4. Confounders

- **Work mix.** Divide counts by a unit of work, per ticket or per session. The u-chart idea is defects per inspection unit. [NIST 6.3.3.1](https://itl.nist.gov/div898/handbook/pmc/section3/pmc331.htm) Report the mix of work kinds on each side.
- **Overdispersion.** Real counts often vary more than Poisson predicts. Standard limits then give false alarms. [Minitab, overdispersion](https://support.minitab.com/minitab/21/help-and-how-to/quality-and-process-improvement/control-charts/supporting-topics/understanding-attributes-control-charts/overdispersion-and-underdispersion/) Check: drop the single worst ticket from each side and run the test again. If the verdict flips, it is "too early". This check is derived, not sourced.
- **Several fixes at once.** Co-interventions are other events near the intervention that also move the outcome. [Bernal et al. 2017](https://doi.org/10.1093/ije/dyw098) Give a verdict to one fix only when it alone touched that problem in the window. Otherwise give the verdict to the group of fixes.
- **Detector change.** A change to data collection at the same time as the intervention can fake an effect. [Bernal et al. 2017](https://doi.org/10.1093/ije/dyw098) Freeze the detector version. Measure both sides again with the same version. Calibrate graders against human reading of transcripts. [Anthropic, Demystifying evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- **Follow-up.** Postmortem practice requires action items and their review. It does not say how to measure their effect. [Google SRE book, Postmortem Culture](https://sre.google/sre-book/postmortem-culture/)

## 5. Recommended verdict rule

1. Count events and units on each side of the apply date with one frozen detector version. "Before" is the last period with no change to that problem. "After" starts at the apply date.
2. If units_after is fewer than 3 sessions, or E = rate_before × units_after is below 5, the verdict is **too early**.
3. Compute RR = rate_after / rate_before and its exact 95% interval from the conditional binomial test.
4. If the upper bound is below 1, the verdict is **better**. If the lower bound is above 1, it is **worse**. If the whole interval is inside [0.5, 2], it is **same**. Otherwise it is **too early**.
5. If dropping the worst ticket on either side flips the verdict, change it to **too early**.
6. Show the verdict, the before rate (events / units, sessions), the after rate (events / units, sessions), RR with its interval, and the fixes that share the window.

## Worked example

- Before: 50 events over 18 tickets = 2.78 per ticket.
- After: 3 events over 10 tickets = 0.30 per ticket.
- E = 2.78 × 10 = 27.8. That is at least 5, so a verdict is allowed.
- Conditional test: 53 events in total, p0 = 10/28 = 0.357. P(X ≤ 3) ≈ 3 × 10^-7.
- RR = 0.108. Exact 95% interval: 0.022 to 0.334.
- The upper bound 0.334 is below 1. Verdict: **better** (2.78 → 0.30 per ticket, 18 tickets before, 10 tickets after).
