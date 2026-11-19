# Retro practice: what established retrospectives add to a problem log

Scope: a recurring retro with one problem log. Each retro re-counts every logged problem, 0 included. A fix is judged by the next count.

## 1. Keep / improve formats

**KPT (Keep, Problem, Try).**
- Alistair Cockburn's reflection workshop uses a chart with "Keep these" and "Try these" columns. It is repeated each month. [alistaircockburn.com deck, via search summary](https://alistaircockburn.com/Crystal%20the%20un-methodology.pdf)
- A first-hand report of a Cockburn workshop names three areas: "Keep these", "Try these", "Ongoing problems". The team picks a few changes to test in the next round. [Brodwall, 2007](https://johannesbrodwall.com/2007/03/05/a-retrospective-training-workshop/)
- Kenji Hiranabe names the format KPT and says Cockburn taught it to him. [Hiranabe, 2005](https://blogs.itmedia.co.jp/hiranabe/2005/10/kpt_cc45.html)
- Carry-over: none of these sources states a rule. Only the label "Ongoing problems" implies that problems persist across rounds.

**Start / Stop / Continue.**
- Groups: Continue, Stop, Start. One author argues Continue should come first. [Intercom](https://www.intercom.com/blog/continue-stop-start-retrospectives)
- No primary origin was found. No carry-over rule was found.

**Plus / Delta.**
- Plus: what produced value. Delta: what to change. It runs in the last minutes of a meeting. [Lean Construction Institute](https://leanconstruction.org/lean-topics/plus-delta/)
- Record all pluses and deltas. A delta that repeats from earlier meetings means the problem was not addressed. [Lean Construction Institute](https://leanconstruction.org/lean-topics/plus-delta/)

**4Ls (Liked, Learned, Lacked, Longed for).** Credited to Mary Gorman and Ellen Gottesdiener. [EBG Consulting](https://www.ebgconsulting.com/?p=993) No carry-over rule was found.

**Mad / Sad / Glad.** A feelings activity in Derby and Larsen's book, section 5.4. [O'Reilly 5.4](https://www.oreilly.com/library/view/agile-retrospectives/9781680500295/f_0034.html) No carry-over rule was found.

## 2. Review of previous actions

- The Scrum Guide says the team "identifies the most helpful changes". It may add them to the next Sprint Backlog. It does not say to review them at the next retro. [Scrum Guide](https://scrumguides.org/scrum-guide.html)
- Derby and Larsen's five phases: Set the Stage, Gather Data, Generate Insights, Decide What to Do, Close. [O'Reilly, Agile Retrospectives](https://oreilly.com/library/view/agile-retrospectives/9781680500295)
- Aino Corry puts "follow up on previous action points" in Setting the Stage. [martinfowler.com](https://www.martinfowler.com/articles/retrospective-antipatterns.html)
- James Shore picks one objective per retro. One person reminds the team of it during the iteration. [Shore, Art of Agile Development](https://www.jamesshore.com/v2/books/aoad1/retrospectives)
- Norman Kerth's book treats end-of-project reviews. [Google Books](https://books.google.com/books/about/Project_Retrospectives.html?id=BxROAQAAIAAJ) Its text was not checked.

## 3. Trend per item across retros

**Spotify Squad Health Check.**
- Each indicator gets a color: green, yellow, red. [Spotify Engineering, 2014](https://engineering.atspotify.com/2014/09/squad-health-check-model)
- Each indicator also gets a trend: stable, improving, or getting worse, shown as an arrow. [Spotify Engineering, 2014](https://engineering.atspotify.com/2014/09/squad-health-check-model)
- The squad decides by discussion and dot voting to reach consensus. It is judgment, not a count. [Spotify Engineering, 2014](https://engineering.atspotify.com/2014/09/squad-health-check-model)
- Suggested interval: quarterly. [Spotify Engineering, 2014](https://engineering.atspotify.com/2014/09/squad-health-check-model)

**Team Radar.**
- Members rate factors such as engineering practices on a 0 to 10 scale and plot them on a radar chart. [search summary of Derby and Larsen 5.7](https://medium.com/@pragprog/5-7-activity-team-radar-485e04c1e24)

**ROTI (Return on Time Invested).**
- Derby and Larsen, section 8.5. Each person rates the retro itself, 0 to 4. 2 means benefit equals time spent. [O'Reilly 8.5](https://www.oreilly.com/library/view/agile-retrospectives/9781680500295/f_0059.html), [DZone](https://dzone.com/articles/60-second-agility-roti)
- It scores the retro, not a problem.

## 4. Tracking "keep" items

- The health check rates every indicator each time, green ones too. A green indicator with a down arrow shows a good area getting worse. [Spotify Engineering, 2014](https://engineering.atspotify.com/2014/09/squad-health-check-model)
- KPT, Plus/Delta, and 4Ls record what went well. No source found re-checks a past "keep" at the next retro.

## 5. Pitfalls

- Only about 60% of action items are acted on. Too many items per retro lowers the rate. [Baldauf, Retromat](https://retromat.org/blog/retrospective-fatigue-how-to-increase-follow-through-on-action-items/)
- Few implemented actions lead to retro fatigue. Teams stop wanting to attend. [Baldauf, Retromat](https://retromat.org/blog/retrospective-fatigue-how-to-increase-follow-through-on-action-items/)
- "Wheel of Fortune": fixing symptoms means the problems "show up again". [Corry, martinfowler.com](https://www.martinfowler.com/articles/retrospective-antipatterns.html)
- "In the Soup": the team discusses problems it cannot change, again and again. [Corry, martinfowler.com](https://www.martinfowler.com/articles/retrospective-antipatterns.html)

## Mapping to the model

| Practice element | Relation | What it would add |
|---|---|---|
| KPT "Ongoing problems" | Matches | Same idea as a persistent problem log. |
| KPT / Plus "keep" group | Adds | Log good practices too, so a drop is seen. |
| Plus/Delta: repeated delta means not addressed | Matches | Same as a count that did not fall. |
| Start/Stop/Continue, 4Ls, Mad/Sad/Glad | Adds little | Prompts for finding new items. No tracking. |
| Review previous actions at start | Matches | Re-count of logged problems is this step, made measurable. |
| Scrum: changes into next Sprint Backlog | Adds | Put the fix into the next run's plan, not only the log. |
| Shore: one objective, one reminder owner | Adds | Limit fixes per run so each effect stays readable. |
| Health check trend arrow | Matches in shape | Better / same / worse per item. The model uses a count, not a vote. |
| Health check color level | Adds | Severity apart from trend: a problem can fall and still be bad. |
| Team Radar 0-10 rating | Conflicts | Rated by judgment, not counted. |
| ROTI | Adds | Score the retro itself, to catch fatigue. |
| 60% follow-through | Adds | Record whether the fix was applied, so "fix failed" differs from "fix not done". |
| Wheel of Fortune | Adds | A count that does not fall after fixes points to a symptom fix. |
| In the Soup | Adds | Mark problems outside the team's control, so they stop taking fix slots. |

## Where sources are thin

- Derby and Larsen, Kerth, and Cockburn's deck were not read in full. Claims rely on excerpts and search summaries.
- No primary origin was found for Start/Stop/Continue or Plus/Delta.
- No source states a carry-over rule for KPT items between retros.
- No practice found counts occurrences per item. Trends are set by judgment or vote.
