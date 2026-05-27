# E · Best practices · what awesome-llms-txt v0.5 is missing before v1

Survey of the 10 most-starred awesome-X lists on GitHub + Lighthouse + Mozilla HTTP Observatory (May 2026). Read against the current state at [`../README.md`](../README.md), [`../CONTRIBUTING.md`](../CONTRIBUTING.md), [`../RUBRIC.md`](../RUBRIC.md).

## 1. Reference table

| List | Stars | Last activity | Strength | Pattern we should steal |
|---|---:|---|---|---|
| sindresorhus/awesome (parent) | 470 K | active daily | The badge ([![Awesome](https://awesome.re/badge.svg)](https://awesome.re)) and a strict list-of-lists gate | "Awesome" badge + a one-page pull-request template that pre-validates the entry |
| vinta/awesome-python | 300 K | daily | Tiered acceptance criteria (Industry Standard / Rising Star / Hidden Gem) and a companion site at awesome-python.com | Explicit, named tiers in CONTRIBUTING. Companion hosted site that ranks GitHub-linked entries higher |
| awesome-selfhosted | 295 K | daily | YAML-per-entry data model + generated `awesome-selfhosted.net` site + rescores | Move from inline list to YAML/JSON per entry; generate the README from data |
| avelino/awesome-go | 174 K | daily | CI-enforced PR template with **13 blocking automated checks** (license, SemVer, Go Report Card grade ≥ A-, coverage link, alphabetical, single-item, forge match) | Auto-extracting PR template + blocking quality gates that run on every PR |
| Hack-with-Github/Awesome-Hacking | 113 K | active | List-of-lists curation discipline | Strict scope statement on the first screen ("what this is, what it isn't") |
| Shubhamsaboo/awesome-llm-apps | 112 K | daily | Strong above-the-fold (logo, single value prop, CTA) | Above-the-fold collapses to one screen with one visible CTA |
| jaywcjlove/awesome-mac | 105 K | daily | 4-language READMEs + auto-deployed HTML site + per-category split files | Per-category split files (24 dev-tools entries is already over the readable cap for one page) |
| punkpeye/awesome-mcp-servers | 88 K | daily | The first awesome list to actively tag entries with "Official / Reference / Community" | Maintainer-quality tags per entry |
| awesomedata/awesome-public-datasets | 76 K | weekly | License + provenance on every entry | Add license/last-modified-by-source columns |
| vuejs/awesome-vue | 74 K | weekly | Org-owned (vuejs/) instead of personal, codifies governance | Move to an `agentrhq/awesome-llms-txt` org repo (governance signal) |
| sindresorhus/awesome-lint | 1 K | active | **15 enforced rules**: badge, balanced-punctuation, code-of-conduct, contributing, double-link, git-repo-age, github, heading, license, list-item, no-ci-badge, no-repeat-item-in-description, spell-check, toc, plus general remark Markdown rules | Run awesome-lint on every PR; ship the badge only after it passes |
| Lighthouse | n/a | n/a | Publishes the [Scoring Calculator](https://googlechrome.github.io/lighthouse/scorecalc/) + explicit per-metric weights (LCP 25, TBT 30, CLS 25, FCP 10, SI 10) | Publish a static `scoring-calculator.html` people can play with |
| Mozilla HTTP Observatory | n/a | n/a | Per-host permalink `/analyze/<host>`, rescan if older than 24 h, [shields.io grade badge](https://shields.io/badges/mozilla-http-observatory-grade) | Host a per-domain permalink + an embeddable shields.io-style grade badge |

## 2. The 11 patterns v0.5 is missing

1. **Awesome-lint clean.** Run `npx awesome-lint` in CI; the [![Awesome]](https://awesome.re/badge.svg) badge is only honest if it passes the 15 rules (heading, list-item, balanced-punctuation, double-link, spell-check, toc, etc.).
2. **Per-entry score badge.** SVG endpoint `/badge/<domain>.svg` → `Score 84 A-` shields-style. Lets vendors brag in their own READMEs (organic distribution).
3. **Hosted "scan-a-site" URL.** `https://awesome-llms-txt.dev/scan/stripe.com` re-scores live in <5 s with a permalink. Mozilla Observatory's killer feature.
4. **Hosted leaderboard (GitHub Pages).** v0.5 says "GitHub Pages view coming soon". That's the headline. Ship it. Sortable table + per-site detail page + Open Graph card per domain (`/sites/stripe.com.png`).
5. **PR template with auto-extracting fields.** Mirror awesome-go: required URLs in the PR body that CI parses (verified_url, score.json hash, domain, category). Reject when missing.
6. **Per-entry data file, not inline rows.** YAML/JSON in `sites/<domain>/data.yml`; the leaderboard table in README is **generated** from it. Today the README, `leaderboard.json`, and per-site folders can drift.
7. **Scoring calculator page.** Static HTML where you tweak the 10 weights and see how the top 10 reshuffles. Lighthouse calls this their highest-traffic doc page.
8. **Embeddable diff/history widget.** A `history/` chart per site (sparkline SVG) so anyone can see Vercel's score went from 65 → 68. Diff-tracking is the differentiator vs `directory.llmstxt.cloud`; surface it visually.
9. **Maintainer team, not a solo curator.** Move the repo under `agentr-labs/`, add 2-3 named maintainers in `MAINTAINERS.md` with review rotation. Solo lists die; org-owned lists (vuejs/, awesome-selfhosted/) live.
10. **"Added by" attribution per entry.** A `submitted_by:` field. Public credit + accountability + recruiting funnel for maintainers.
11. **Single-screen above-the-fold.** Today the README opens with 5 KB of prose, badges, then a wide table that wraps awkwardly. Pattern from awesome-llm-apps / awesome-mac: logo + one-line positioning + the **score-your-site command** as the first CTA, full leaderboard one scroll down.

Optional but high-value: **monthly "What changed" digest** (auto-generated from the crawl regressions), **`/.well-known/awesome-llms-txt.json`** so other tools can consume the dataset, **CC0 dataset on Kaggle/HF Datasets** for distribution.

## 3. Is v0.5 launchable?

**No.** Strong content, weak surface. Three reasons: (1) the README does not pass awesome-lint, so the [![Awesome]](https://awesome.re/badge.svg) badge at the top is currently aspirational — sindresorhus rejects unlinted lists from the parent index, killing the biggest distribution channel; (2) every comparable directory in the space (llms-txt-hub, directory.llmstxt.cloud) already has a hosted site, while ours says "coming soon" in the headline screen — that single phrase signals beta; (3) there is no embeddable badge, no scan-a-site URL, and no maintainer team, so a vendor who scored well has no way to brag and no human to appeal to.

## 4. Top 5 changes before v1 (ranked by impact / effort)

1. **Ship `awesome-lint`-clean + add the badge honestly** (1 day). Smallest fix, removes the largest blocker, unlocks listing in `sindresorhus/awesome`.
2. **Hosted GitHub Pages leaderboard at `awesome-llms-txt.dev` with per-site permalinks + Open Graph cards** (3 days). Replaces the "coming soon" promise. Each site gets a shareable URL — the Mozilla Observatory pattern.
3. **Per-domain SVG score badge endpoint** (1 day if hosted as static SVG generated by the crawl). Turns every well-scoring vendor into a distribution node.
4. **CI-enforced PR template + YAML data files (`sites/<domain>/data.yml`) + generated README** (2 days). Mirrors awesome-go. Eliminates drift between README / `leaderboard.json` / per-site folders, makes contribution mechanical.
5. **Move to `agentrhq/awesome-llms-txt`, add `MAINTAINERS.md` with 2-3 names + governance paragraph** (half a day). Cheapest legitimacy signal; addresses the solo-curator failure mode visible in dead awesome-* forks.

Sources:
- [sindresorhus/awesome contributing.md](https://github.com/sindresorhus/awesome/blob/main/contributing.md)
- [sindresorhus/awesome-lint rules](https://github.com/sindresorhus/awesome-lint/tree/main/rules)
- [vinta/awesome-python CONTRIBUTING.md](https://github.com/vinta/awesome-python/blob/master/CONTRIBUTING.md)
- [avelino/awesome-go CONTRIBUTING.md](https://github.com/avelino/awesome-go/blob/main/CONTRIBUTING.md) + [PR template](https://github.com/avelino/awesome-go/blob/main/.github/PULL_REQUEST_TEMPLATE.md)
- [Lighthouse Performance Scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring) + [scoring calculator](https://googlechrome.github.io/lighthouse/scorecalc/)
- [Mozilla HTTP Observatory FAQ](https://developer.mozilla.org/en-US/observatory/docs/faq) + [shields.io grade badge](https://shields.io/badges/mozilla-http-observatory-grade)
