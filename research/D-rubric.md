# D · Rubric, README skeleton, grading bands

## (a) README skeleton

```markdown
# Awesome llms.txt [![Awesome](https://awesome.re/badge.svg)](https://awesome.re)

> The public leaderboard of llms.txt quality. Stripe scores 87. Vercel scores 81. Your site?

A curated, scored ranking of production `llms.txt` files. Inspired by Lighthouse, graded like Mozilla Observatory. Run by [Agentr](https://agentr.dev).

## Contents

- [Leaderboard (Top 10)](#leaderboard)
- [Methodology](#methodology)
- [By category](#by-category)
  - [Payments](#payments) · [Dev tools](#dev-tools) · [Cloud](#cloud) · [AI](#ai) · [Docs platforms](#docs-platforms)
- [Hall of shame](#hall-of-shame)
- [Contributing](#contributing)

## Leaderboard

| # | Site | Score | Grade | Spec | Coverage | Freshness |
|---|------|------:|:-----:|:----:|:--------:|:---------:|
| 1 | stripe.com   | 87 | A- | pass | 96% | 4d  |
| 2 | vercel.com   | 81 | B+ | pass | 88% | 11d |
| 3 | anthropic.com| 78 | B  | pass | 82% | 9d  |
| … | …            | …  | …  | …    | …   | …   |

[Full table →](./leaderboard.md)

## Methodology

See [SCORING.md](./SCORING.md). Ten weighted criteria, 0-100, log-normal curve, refreshed weekly.

## Contributing

PRs welcome. See [contributing.md](./contributing.md). Submissions must pass [awesome-lint](https://github.com/sindresorhus/awesome-lint).

## License

[CC0](./license)
```

## (b) Refined rubric (100 points)

| # | Criterion | W | What we check | Why this weight |
|---|---|---:|---|---|
| 1 | Spec compliance | 18 | Valid `# H1` title, blockquote summary, `##` section headings, link list grammar per llmstxt.org | Highest single weight, mirrors Lighthouse's 30% on TBT: spec correctness is the gating signal. |
| 2 | Coverage | 20 | Share of canonical site sections (pricing, API ref, quickstart, errors) reachable from `llms.txt` | Biggest weight: an incomplete index is useless to an agent, even if perfectly formatted. |
| 3 | Agent-action declarations | 14 | Presence of `llms-full.txt`, per-section `.md` mirrors, and machine-readable endpoints | Slight reduction from 15: critical but partially overlaps coverage. |
| 4 | Linked-content stability | 10 | HTTP 200 on every linked URL, no redirects to login walls, stable canonical hash | Matches Lighthouse FCP weight. Dead links destroy trust fast. |
| 5 | Freshness | 10 | Last-Modified or visible commit within 30 days, drift vs sitemap | Same as Lighthouse FCP. Stale indexes are the #1 complaint. |
| 6 | Discoverability | 8 | Served at `/llms.txt`, referenced in `robots.txt`, correct `Content-Type: text/markdown` | Reduced from 10: binary-ish check, doesn't deserve double-digit weight. |
| 7 | Auth signposting | 8 | Clearly flags which endpoints require auth and links to OAuth/API-key docs | Reduced from 10: matters but only for a subset of providers. |
| 8 | Size discipline | 6 | Bytes, line count, and ratio of links to prose stay within p75 of corpus | Slight bump from 5: oversized files break context windows. |
| 9 | Content-Type & encoding | 4 | UTF-8, LF line endings, served as `text/markdown; charset=utf-8` | Reduced from 5: easy, low-signal. |
| 10 | Voice | 2 | Plain, declarative, no marketing fluff, no em-dashes | Reduced from 5: subjective; keep present as a tiebreaker only. |

Reweighting rationale: Lighthouse concentrates ~55% on two metrics (TBT 30, LCP/CLS 25 each). We mirror that by concentrating ~52% on **Coverage + Spec + Agent-actions** — the load-bearing axes. Style and discoverability shrink because they're binary.

## (c) Grade thresholds (Observatory-style)

| Grade | Score | Color |
|-------|-------|-------|
| A+ | 95+ | green |
| A  | 85-94 | green |
| A- | 80-84 | green |
| B+ | 75-79 | lime |
| B  | 65-74 | lime |
| C  | 50-64 | amber |
| D  | 35-49 | orange |
| F  | 0-34 | red |

Borrowed from Mozilla Observatory but compressed: Observatory allows scores >100 via bonuses; we cap at 100 like Lighthouse so the leaderboard is comparable across runs. A=85 matches Lighthouse "Good" green threshold, making screenshots instantly legible to anyone who's seen a Lighthouse report.

## (d) What creates discussion

Lighthouse scores spread because they are **(1) a single integer**, **(2) color-coded the same way everywhere**, and **(3) reproducible by anyone in 30 seconds**. We replicate all three: one headline number per site, the same green/amber/red palette PageSpeed uses (so engineers pattern-match instantly), and a public scanner URL anyone can paste a competitor into. The screenshot-worthy unit is the **head-to-head card** — "Stripe 87 vs Plaid 42" with the deltas per criterion — because it gives the reader both a flex and an action item. Visible, comparable, contestable: leave room for vendors to argue the score and submit fixes via PR, and the leaderboard becomes its own marketing engine.

Sources:
- [sindresorhus/awesome](https://github.com/sindresorhus/awesome)
- [awesome-lint](https://github.com/sindresorhus/awesome-lint)
- [Lighthouse Performance Scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring/)
- [Web Vitals](https://web.dev/articles/vitals)
- [Mozilla HTTP Observatory scoring](https://github.com/mozilla/http-observatory/blob/main/httpobs/docs/scoring.md)
