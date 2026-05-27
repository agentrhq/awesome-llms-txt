# Rubric

This is the scoring methodology behind every grade in this repo. It is **public, weighted, and contestable**. If you think a weight is wrong, open an issue. If you think your site's score is wrong, follow the appeals process in [`CONTRIBUTING.md`](./CONTRIBUTING.md). We won't move weights to flatter any one vendor. That's the whole point.

## Design principles

1. **Reproducibility over editorial judgement.** Every score must be recoverable from running `llms-txt-score` against the live file. The Voice criterion is the only mildly subjective one, and it is capped at 2 points.
2. **Reward what the spec mandates, not what's convention.** The spec only *requires* an H1. Everything else (blockquote summary, `## Optional` section, `llms-full.txt`, `.md` twins, `Content-Type: text/markdown`) is convention or "good practice." Convention scores points; the absence of convention should not be ruinous.
3. **Coverage and Spec compliance carry the most weight.** A correctly structured, thoroughly indexed file is the load-bearing axis. We borrow Lighthouse's "two metrics carry most of the weight" pattern.
4. **Static checks first, network checks where useful.** Discoverability, Content-Type, Size, and Spec compliance need no network. Linked-content stability and Freshness do. Both are sampled, both cap their downside.
5. **No vibes.** No "this site looks neat" bonus. Every point is earned against a rule that is checked by code.

## Total score

| Weight | Criterion | What we check | Why this weight |
|------:|---|---|---|
| **20** | **Coverage** | Section count (cap 5 pts), total link count (log-scaled, cap 10 pts), canonical-section diversity covering docs / api / quickstart / guides / auth / errors / changelog / pricing / webhooks / sdk (cap 5 pts) | Heaviest weight. An incomplete index is useless even when perfectly formatted. |
| **18** | **Spec compliance** | First-line `# H1` (4 pts), blockquote summary (2 pts), one or more `## H2` sections (3 pts), each H2 containing well-formed `[name](url): note` bullets (4 pts), valid link syntax (3 pts), no structural malformations (2 pts) | Second-heaviest. Mirrors Lighthouse's TBT weighting. Spec correctness gates everything downstream. |
| **14** | **Agent-action declarations** | Companion `llms-full.txt` linked (3 pts), `.md` URL twins on listed pages (5 pts), signposts for MCP / `.well-known/` / agent-skills / A2A (3 pts), machine-readable API spec link OpenAPI / Swagger (3 pts) | Coverage tells the agent *what's there*. Agent-actions tell it *how to use it*. We weight the convention slightly less than what's literally in the spec. |
| **10** | **Linked-content stability** | Sampled HEAD requests on 8 random links from the file; one point per successful response, scaled to 10 | Dead links destroy trust fast. Sampled (not full) so a single broken link doesn't tank the score. |
| **10** | **Freshness** | `Last-Modified` header age. ≤7d → 10, ≤30d → 9, ≤90d → 7, ≤180d → 5, ≤365d → 3, older → 1. No header → 5 (neutral default) | Stale indexes are the #1 documented complaint about `llms.txt` in the wild. |
|  **8** | **Discoverability** | HTTP 200 at exactly `/llms.txt` (5 pts), no redirect chain (2 pts), no auth wall (1 pt) | Binary-ish check, doesn't deserve double digits, but skip these and you fail the spec. |
|  **8** | **Auth signposting** | Keyword presence: `auth`, `API key`, `OAuth`, `Bearer`, `Authorization` (3 pts); dedicated `## Auth` / `## Authentication` section (5 pts) | Critical for credential-routing agents, but only for sites that *have* auth. Sites with no API surface are not penalised for missing this. |
|  **6** | **Size discipline** | Under 8 KB → 6, 8-32 KB → 5, 32-64 KB → 4, 64-128 KB → 2, 128-512 KB → 1, over 512 KB → 0; below 200 B → 0 (stub) | Oversized files break context windows. Twilio's 2.2 MB file is the cautionary example: high coverage, zero size discipline. |
|  **4** | **Content-Type & encoding** | `text/markdown` or `text/plain` (3 pts), UTF-8 charset declared (1 pt) | Low-signal but trivially correctable. |
|  **2** | **Voice** | Default 2. Subtract 1 for two or more marketing phrases (`industry-leading`, `revolutionary`, `seamlessly`, etc.). Subtract 1 for em-dashes in the intro paragraph. | Tiebreaker only. Subjective, capped, contestable. |
| **100** | **Total** | | |

## Grade thresholds

Borrowed from Mozilla HTTP Observatory (which uses A+ down to F), capped at 100 for cross-run comparability. `A ≥ 85` matches Lighthouse's "green" threshold, so screenshots are instantly legible to anyone who's ever read a PageSpeed report.

| Grade | Score | Badge color |
|-------|------:|-------------|
| A+    | 95-100 | brightgreen |
| A     | 85-94 | brightgreen |
| A-    | 80-84 | green |
| B+    | 75-79 | green |
| B     | 65-74 | yellowgreen |
| C     | 50-64 | yellow |
| D     | 35-49 | orange |
| F     | 0-34 | red |

## What you can argue with

We expect three live debates:

- **"Voice is too subjective."** Yes. That's why it's 2 points and capped. It exists to prevent literal LinkedIn-grade copy from scoring identically to plain English.
- **"Linked-content stability shouldn't be sampled. Check them all."** Cost vs. signal tradeoff. Sampling 8 catches 95% of regressions and respects rate limits on monthly crawls. Open to revisiting if better data appears.
- **"You under-weight Freshness."** Maybe. The argument against weighting it higher: many `llms.txt` files are auto-generated on every deploy and would never go stale even when they should be re-indexed. We trust `Last-Modified` only because nothing else is available.

## How re-scoring works

[`.github/workflows/crawl.yml`](./.github/workflows/crawl.yml) runs monthly. For each site in `sites/<domain>/`:

1. Fetch the live `verified_url`.
2. Save the new file to `sites/<domain>/history/<YYYY-MM-DD>.txt`.
3. Re-run `llms-txt-score` against the new file.
4. If the score changed by ≥ 5 points, open a PR. If the score dropped by ≥ 10 points, open an issue tagged `regression` and mention the domain's listed maintainer.

PRs are squash-merged once CI re-scores and matches the committed `score.json`.

## What the tool actually does

Source: [`tools/llms-txt-score/`](./tools/llms-txt-score). Zero runtime dependencies, Node ≥ 18. The parsing logic is in [`lib/parse.js`](./tools/llms-txt-score/lib/parse.js), the scoring in [`lib/score.js`](./tools/llms-txt-score/lib/score.js), grade bands in [`lib/grade.js`](./tools/llms-txt-score/lib/grade.js). 92 lines of tests in [`test/run.js`](./tools/llms-txt-score/test/run.js). If you spot a bug in the scoring, the patch is small.

