# Show HN draft

## Title

Show HN: I scored 1,023 production llms.txt files. Twilio got an F.

## URL

`https://github.com/agentrhq/awesome-llms-txt`

## Text

This is a scored leaderboard, the methodology, the CLI that reproduces it, and a GitHub Pages site you can sort.

I crawled `/llms.txt` from 1,275 candidate domains and accepted 1,023 valid responses. Then I scored each one against a 10-criterion rubric: Coverage 20, Spec compliance 18, Agent-action declarations 14, Linked-content stability 10, Freshness 10, Discoverability 8, Auth signposting 8, Size discipline 6, Content-Type 4, Voice 2. 100 points total.

Highlights from the May 2026 crawl:

- 3 A's: Neon (89), Convex (86), Resend (85). 8 A-'s. 51 B+'s. 233 B's.
- Stripe Docs: 69 (B). Vercel: 71 (B). Anthropic Docs: 68 (B). All middling.
- Twilio: 27 (F). 2.2 MB file, 8,743 links, no H1, no blockquote. Coverage maxes out; spec compliance cratered.
- Notion: 29 (F). Multiple H1s, malformed link items.
- Average: 58. Median: 58. Grade distribution: A=3, A-=8, B+=51, B=233, C=539, D=144, F=45.
- 554/1,023 sites returned `Last-Modified`. The rest score a neutral default on Freshness.

Bottom-of-leaderboard sites are mostly five-minute fixes: missing H1, no blockquote, no `## Auth` section, wrong Content-Type. A few are oversized (Twilio, Tamagui, Datadog have huge files with high blog-link ratios).

Reproduce any score with: `npx llms-txt-score https://your-site.com/llms.txt`

Zero deps, Node 18+. 17 passing tests. Source in `tools/llms-txt-score/`.

Monthly re-crawl is wired into Actions. Score drops auto-open a regression issue. Appeals are public (issue template in repo). Rubric changes batched quarterly so historic scores stay comparable.

Each site has its own SVG badge at `web/badge/<domain>.svg` and a permalink page at `agentrhq.github.io/awesome-llms-txt/site/<domain>.html`.

Nobody had built a scored comparison of `llms.txt` files. Every existing directory I could find (`directory.llmstxt.cloud`, `llms-txt-hub`, `SecretiveShell/Awesome-llms-txt`) is alphabetical or sorted by raw token count. The dataset is CC0; the tool is MIT.

Happy to argue about weights. I expect the heaviest debate on:

- **Voice (2 pts)**: partly subjective; includes an em-dash check in the intro paragraph.
- **Low-value link discount**: Coverage no longer counts links matching `/blog/`, `/case-stud/`, `/press/`, `/careers/`, `/legal/`. Datadog dropped from B to where it sits now because of this. Stripe was lightly affected.
- **Freshness default (5/10)**: neutral when `Last-Modified` is absent. Some will argue that's too generous; others that "auto-regenerated on every deploy" makes the column noisy regardless.

Disclosure: I don't curate the corpus. Every site that publishes a valid `llms.txt` gets scored. The expanded set was harvested from `directory.llmstxt.cloud`, `SecretiveShell/Awesome-llms-txt`, and `thedaviddias/llms-txt-hub`. If your site appears and you'd rather not be on it, take down the file.
