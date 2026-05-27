# X thread — launch day

The first post is the screenshot. The rest is the punchline.

---

**1/10** We scored every production `llms.txt` we could find. 1,023 of them. Same rubric shape as Lighthouse.

Only three sites earned an A. Twilio and Notion both got F.

`github.com/agentrhq/awesome-llms-txt`

[screenshot: the leaderboard, Top 10 with green A badges, then the Notable Failures table below with Twilio 27 F and Notion 29 F]

---

**2/10** Headline numbers:

· **1,023** accepted `llms.txt` files (1,275 attempted, 252 returned 404 or HTML).
· **3 A's**: Neon (89), Convex (86), Resend (85).
· **8 A-'s**: Openfort, Zapier, Apify, PostHog, Speakeasy, Keito, Venice API, X Developer Platform.
· Stripe Docs: **69** (B). Vercel: **71** (B). Anthropic Docs: **68** (B).
· Average: **58**. Median: **58**.

---

**3/10** Twilio's `llms.txt` is a 2.2 MB file with 8,743 links, no H1, no blockquote, 41% blog and customer-story URLs.

Score: 27 (F).

Coverage 17/20. Spec compliance 4/18 (no H1 hard floor). Size discipline 0/6. The rubric punishes bloat.

[screenshot: Twilio's score card]

---

**4/10** Notion: 29 (F). Their `llms.txt` is 6.8 KB but has multiple H1s, malformed link items, and no auth section.

Most low scores are 5-10 minute fixes:
· Move the H1 above any banner text
· Add a `> blockquote` summary
· Add a `## Auth` (or `## Credentials`, `### Authentication`) section
· Drop a link to `/llms-full.txt`

---

**5/10** Sites that publish *no* `llms.txt` at all and you might assume would:

openai.com · anthropic.com (apex) · figma.com · huggingface.co · docker.com (apex) · gitlab.com · discord.com · tailwindcss.com · perplexity.ai (apex) · mintlify.com (apex)

The corpus crawl saw these as 404s.

---

**6/10** The rubric is 10 weighted criteria, 100 points, public and contestable.

Heaviest weights:
· **Coverage 20** — value-weighted link count (blog/case-study URLs discounted), section diversity
· **Spec compliance 18** — H1 first line, well-formed `[name](url): note` lists
· **Agent-action declarations 14** — `llms-full.txt`, `.md` twins, MCP, OpenAPI

Full rubric in RUBRIC.md.

---

**7/10** Freshness is real now. We HEAD'd every URL, captured `Last-Modified`, computed age in days.

54% of sites return the header. The rest score the neutral 5/10 default until they ship one.

Median age among sites that emit a header: 0 days (most are auto-regenerated on every deploy).

---

**8/10** Reproduce any score with one command:

```shell
npx llms-txt-score https://your-site.com/llms.txt --format=markdown
```

Zero deps. Node 18+. 17 tests in the repo. Monthly re-crawl auto-opens a PR; score regressions auto-open an issue.

---

**9/10** Every site gets an SVG badge. Drop this in your README:

```markdown
![llms.txt score](https://raw.githubusercontent.com/agentrhq/awesome-llms-txt/main/docs/badge/your-site.com.svg)
```

Color updates with the grade. Re-scored monthly.

---

**10/10** Why we built it: `llms.txt` is the file a site uses to tell an agent what it can do. Nobody was scoring them. Lighthouse showed that a public scorecard creates better files — so we built one.

Repo + leaderboard + tool: `github.com/agentrhq/awesome-llms-txt`
Web view: `agentrhq.github.io/awesome-llms-txt`
