# Contributing

Three ways to contribute:

1. **Add a site to the leaderboard.** One PR per site.
2. **Appeal a score** that you think is wrong. Public appeals.
3. **Propose a rubric change** (weights, criteria, thresholds). Issues only — no surprise PRs against `RUBRIC.md`.

## Add a site

1. Score the live `llms.txt` with the tool:
   ```bash
   npx llms-txt-score https://your-site.com/llms.txt > score.json
   ```
2. Create `sites/<your-domain>/` containing:
   - `llms.txt` — the snapshot you scored (verbatim bytes).
   - `score.json` — the JSON from the tool, untouched.
   - `README.md` — see frontmatter spec below.
   - `history/<YYYY-MM-DD>.txt` — a dated copy of the snapshot.
3. Open one PR titled `add: <domain>`.

CI re-fetches the URL, re-runs the scoring tool, and **rejects the PR if your committed `score.json` doesn't match the re-run.** This is intentional — we do not accept manually-edited scores.

### Required frontmatter for `sites/<domain>/README.md`

```yaml
---
domain: stripe.com
display_name: Stripe
category: billing
score: 87
grade: A
last_scored: 2026-05-27
verified_url: https://stripe.com/llms.txt
---
```

Valid `category` values: `ai-platform`, `dev-tools`, `docs-platform`, `billing`, `comms`, `data`, `infra`, `observability`, `auth`, `search`, `content`, `commerce`. Pick the closest. We will rename categories aggressively in the first month — don't fight the system.

### What gets your PR rejected automatically

- Manual edits to `score.json` (CI re-runs the tool).
- A `verified_url` that returns anything other than HTTP 200.
- An `llms.txt` snapshot older than 7 days.
- An entry whose domain already exists. (Submit an update PR instead.)
- A site whose `llms.txt` is HTML, JSON, or behind a login.

### What we manually check

- The `display_name` matches the site's own branding.
- The `category` makes sense.
- The Voice criterion (2 pts) — the only place a human looks.

## Appeals

> If you think your site's grade is wrong, the appeal is public. No private email negotiation.

1. Open an issue titled `appeal: <domain>` using the [appeal template](./.github/ISSUE_TEMPLATE/appeal.yml).
2. Quote the rubric criterion and the points you disagree with.
3. Show your work — point to the lines in the file, the spec, or the live data.
4. We respond within seven days, on the issue.

Reasonable appeals to expect:
- "Our `llms-full.txt` lives at `/docs/llms-full.txt`, the tool didn't find it." → tool fix.
- "Our auth section is named `## Credentials` not `## Auth`." → tool fix (regex broadening).
- "Our `Last-Modified` header is correct, but the score still uses the default." → CI bug.

Appeals we'll close:
- "Your weight on Coverage is too high." → that's a rubric proposal, not an appeal.
- "You're penalising us for em-dashes." → yes; the rule is documented.
- "Our site doesn't need an `llms.txt`." → don't submit one then.

## Propose a rubric change

Open an issue titled `rubric: <change>`. Include:

- The criterion(ria) you'd reweight, add, or remove.
- One paragraph on why.
- One paragraph on the expected effect — would the top 10 reshuffle?
- A pointer to similar choices in Lighthouse / Mozilla Observatory / W3C / the llms.txt spec itself.

We review proposed rubric changes **quarterly**, in batches, to avoid score thrash. Changes that pass are versioned (`schema_version: 2` in `score.json`), so historical scores remain comparable.

## Code

The scoring tool lives in [`tools/llms-txt-score/`](./tools/llms-txt-score). Patches welcome, especially:

- Better section-diversity detection (current implementation is keyword-matched).
- Smarter link sampling (e.g. always sample the first link in every section).
- Live-fetch caching so the CLI is fast for repeat-runs.

Run tests:

```bash
cd tools/llms-txt-score
node test/run.js
```

## What we won't accept

- Adding `llms.txt` files that aren't actually served at the live URL.
- Sites whose only goal is gaming the rubric (long fake link lists, etc.). The "Coverage" criterion looks at link diversity, not raw count, and a future patch will detect repetition.
- A grade bump in exchange for a sponsorship. No.
- Anything that bundles a third-party SDK into the CLI. Reproducibility means zero deps.

## License

This repo's data (the `sites/<domain>/` content and scoreboards) is [CC0-1.0](./LICENSE). The scoring tool source is MIT. Submitting a PR confirms you're OK with both.

