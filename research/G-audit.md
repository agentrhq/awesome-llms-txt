# G. Pre-launch audit

The corpus is fine. The scorer is the problem. Five defects dominate:
(1) parser drops every link when the file has no `## H2`,
(2) auth signposting only sees `## auth` (misses `### Authentication`, `## Access`, `## Credentials`),
(3) freshness is uniformly `5/10` for all 91 sites (Last-Modified never plumbed),
(4) spec compliance forgives missing H1, multiple H1s, and H1s buried after intros,
(5) coverage maxes out on raw link count even when 90 % are blog posts.

## Scores I'd contest

Too high:

1. **twilio.com 69 (B)** — no H1, no blockquote, 2.2 MB, 41 % blog links. Spec gave 10/18 anyway; coverage 20/20 on raw count. Patch: cap spec ≤ 8 when `no_h1`; discount `/blog|/customer-stor|/case-stud` URLs.
2. **tamagui.dev 55 (C)** — 1 MB doc dump with 815 H2s and 64 H1s; it's a full-content file masquerading as an index. Patch: penalise `>100` H2 or multi-H1.
3. **www.gradio.app 56 (C)** — H1 at line 16 behind intro list, 25 embedded downstream H1s. `h1_not_at_top` reason fires but still grants +3. Patch: forfeit the H1 bonus when `h1_line > 5`.
4. **datadog.com 65 (B)** — 1954/2251 links are blog/customer-story (87 %). Same discount patch as Twilio.
5. **www.tinybird.co 57** is honest, but the more flagrant problem is **stripe.com 69**: marketing fluff and em-dashes fire correctly, but coverage 20/20 on duplicated `/payments`-style slugs is generous.

Too low:

6. **kotlinlang.org 34 (F)** — 470 valid links, parser reports `link_count: 0` because they live outside any `## H2`. Worst false negative in corpus.
7. **viem.sh 37 (D)** — 544 flat link bullets, same root cause. Should be B-range.
8. **amplitude.com 59 (C)** — best agent-first file in corpus (MCP server, `## Auth`, Wizard CLI, llms-full). Parser sees `link_count: 0` because links live in code blocks and inline prose.
9. **cohere.com 52 (C)** — structured "Optional / Supplemental" hierarchy, explicit LLM instructions, but bare `- https://...` bullets. `LINK_RE` requires `[text](url)` so `link_count: 0`. Should be B.
10. **docs.anthropic.com 58 (C)** — 1541 `.md` twin links but only 3 H2s, so `coverage` penalises "thin_sectioning" while it actually has more linked surface area than anything except Twilio and PostHog.

## Categorization fixes

| Domain | Current | Should be | Why |
|---|---|---|---|
| `www.unkey.com` | data | auth | API-key management; sibling of Clerk/WorkOS |
| `turbo.build` | docs-platform | dev-tools | Build system; matched `docs?` fallback on H1 |
| `langfuse.com` | data | observability | LLM tracing platform |
| `www.helicone.ai` | data | observability | LLM observability |
| `notion.so` | docs-platform | dev-tools (or new productivity) | Workspace, not a docs host |
| `docs.github.com`, `github.com` | data | dev-tools | Leaderboard miscategorization |
| `www.mux.com` | data | content (or infra) | Video API |
| `trigger.dev` | data | dev-tools | Background-jobs / workflows |

Also: `display_name` for `github.com` and `docs.github.com` is `"Github"` (should be `GitHub`); `sdk.vercel.ai` shows as `"Vercel"` (should be `"Vercel AI SDK"`); `replicate.com` H1 is the tagline `"Run AI with an API"`, not a brand.

## Scoring-tool patches (`lib/parse.js`, `lib/score.js`)

1. **Count links outside H2.** In `parse.js`, scan top-level bullets between H1 and first H2 and include them in `link_count`. Fixes Kotlin, viem, Cohere.
2. **Accept bare-URL bullets.** Extend `LINK_RE` with `^\s*[-*]\s+(https?://\S+)` fallback. Fixes Cohere, partial MongoDB.
3. **Treat H3 as a section.** Add `subsections` to each H2; compute `effective_sections = h2 + 0.5 * h3` for coverage; let auth-section regex match H3 titles. Fixes Linear, Better Auth, Convex, Postmark.
4. **Broaden auth regex.** In `scoreAuthSignposting`: match `^(auth|authentication|authorization|api keys?|credentials|access|access tokens?|api authentication|user authentication|security)$` against H2 *and* H3. Fixes Vercel `## Access`, Postmark `### Authentication`, Clerk `### User Authentication`.
5. **Hard-floor for missing H1.** In `scoreSpecCompliance`, cap total at 6 when `!p.h1`. Fixes Twilio, Notion.
6. **Multi-H1 + code-fence awareness.** Track `in_code_fence` toggled by ` ``` ` lines; ignore `#`/`##` inside fences. Track `h1_count`; subtract 2 when > 1. Fixes Tamagui, false positives on Amplitude/Resend.
7. **Forfeit H1-present grant when buried.** Give `+0` (not `+3`) when `h1_line > 5`. Fixes Gradio.
8. **Discount low-value links.** Compute `value_links = link_count - matches(/(blog|customer-stor|case-stud|events|press|legal|careers)/i)` and feed `value_links` into the log ladder. Fixes Twilio, Datadog, Stripe.
9. **Plumb Last-Modified.** In `bin/llms-txt-score.js` and the fetch layer, forward the `last-modified` header into `opts.last_modified`. Today 91/91 sites get default 5/10; freshness contributes nothing to ranking.
10. **Voice em-dash false positive on flat files.** When `section_count === 0`, every bullet ends up in `intro_paragraphs`, so an em-dash inside a link title (Kotlin: "React and Kotlin/JS — tutorial") falsely trips `em_dashes_in_intro`. Restrict em-dash detection to lines before the first list bullet.
11. **Mojibake detector in `scoreContentType`.** MongoDB has literal `worldâ€™s` in its blockquote (Latin-1 decoded as UTF-8) and still scored 4/4 on content type. Detect `Ã\x80-Ã¿` runs and dock 1 pt.

## Reproducibility

Ran the CLI offline against three `score.json`s:

- `resend.com` → CLI 75, file 75 — **pass**
- `cohere.com` → CLI 52, file 52 — **pass**
- `twilio.com` → CLI 71, file 69 — **drift** (CLI grants partial `discoverability` because it can't observe the redirect chain offline)

Reproducibility is fine for content scoring. HTTP-derived components (`discoverability`, `freshness`, `content_type`) silently shift when re-run without the fetch envelope. The CLI should accept `--fetched-url`, `--final-url`, `--last-modified` flags and the docs should say "scores are only reproducible alongside the captured fetch metadata".

## Embarrassment risk (HN top-comment bait)

1. **"Your scorer gives Kotlin an F and Twilio a B. Kotlin has 470 links; Twilio has no H1."** Single most likely screenshot. Fix patches 1, 2, 5 before launch.
2. **"Every site scored exactly 5/10 on freshness, it's a theater column."** A reader sorts the JSON and the column is constant across all 91 rows. Fix patch 9.
3. **"Vercel's `## Access`, Postmark's `### Authentication`, and Clerk (which literally is an auth product) all lose points on auth signposting."** The auth criterion is the leaderboard's signature and is currently brittle. Fix patch 4.
