# C · Competitor & gap map for an llms.txt leaderboard

## 1. Existing landscape

| Name | URL | Type | Popularity | What it covers | Critical gap |
|---|---|---|---|---|---|
| llmstxt.org (Answer.AI spec) | llmstxt.org · github.com/AnswerDotAI/llms-txt | official spec | 2,414 stars | The standard itself, links out to two registries | No registry, no scoring |
| SecretiveShell/Awesome-llms-txt | github.com/SecretiveShell/Awesome-llms-txt | list (README) | 99 stars, 46 forks | Alphabetical README index, ~600 URLs, paired MCP server | Plain list. No scores, no categories, no diffs |
| thedaviddias/llms-txt-hub | github.com/thedaviddias/llms-txt-hub | gallery site | 845 stars, 461 forks | Next.js directory, self-styled "largest" | Listing only. No score, no grade, no history |
| directory.llmstxt.cloud | directory.llmstxt.cloud | gallery | 1,600+ entries across 21 pages | Filter by Websites / Products / Devtools / AI / Finance; sort by token count | Token-count sort is the only "ranking". No quality grade |
| llmstxt.site | llmstxt.site | gallery | 1,000+ entries (truncated count) | Submission-driven catalog with std + full token counts | No ranking, no scoring |
| llms-txt.io | llms-txt.io | generator + validator + directory | combined product | Generates and validates files; lists adopters | Validator is pass/fail. No comparative score or leaderboard |
| llmstxtchecker.net | llmstxtchecker.net | validator | low/unknown | Checks a single file against the spec | Single-URL pass/fail, no leaderboard surface |
| Hostinger llmstxtvalidator.org · mrs.digital validator · rankability.com · asvaai.com · aioseo etc. | various | validator/generator | low/medium | Pass/fail validators, generators | None score adopters, none publish rankings |
| firecrawl/llmstxt-generator | github.com/firecrawl/llmstxt-generator | generator | 525 stars | CLI/web that crawls a site and emits llms.txt | Generator only |
| langchain-ai/mcpdoc | github.com/langchain-ai/mcpdoc | consumer tool | 992 stars | Exposes existing llms.txt to IDEs via MCP | Consumes, doesn't grade |
| Mintlify | mintlify.com/docs/ai/llmstxt + blog "real llms.txt examples" | platform | enterprise scale | Auto-hosts /llms.txt and /llms-full.txt for docs customers; blog tours "good examples" qualitatively | No public scorecard, no leaderboard |
| Vercel | vercel.com/blog/...llms.txt | platform | n/a | Proposed inline `<script type="text/llms.txt">`; no directory | No directory or scoring |
| Synaptiv-AI/awesome-n8n, dontriskit, BrethofAI, jtmuller5, leadmediacx, thedotmack | github | niche/dormant forks | 0-186 stars | Niche or thin clones of Awesome-llms-txt | None score |

## 2. HN / X sentiment

- The original Sep-2024 thread ([HN 41439983](https://news.ycombinator.com/item?id=41439983), 206 pts) is dominated by "why another root-level file, use /.well-known/" and "this only helps scrapers, what's in it for me as a site owner".
- May-2026 thread ([HN 47058870](https://news.ycombinator.com/item?id=47058870)) cites server-log evidence that ChatGPT/Claude user agents never request /llms.txt — only generic crawlers and SEO tools do. Tone: vindicated skepticism.
- X / blog discourse echoes Otterly's 62.1K-bot-hits-vs-84-llms.txt-hits experiment and the SE Ranking 300K-domain study — repeated dunks, no defenders with data.

## 3. Reddit sentiment

- r/SEO ("Is llms.txt a scam?", "SEO noob full of shit", "SE Ranking: LLMS.txt does nothing - 300,000 domains"): consensus is hostile — practitioners say no major LLM fetches it and anyone selling it as a service is a grifter.
- r/aeo, r/SEO_LLM, r/seogrowth, r/TechSEO: softer, cargo-cult position — "checkbox task, can't hurt, might matter later". Recent Dec-2026 pivot after Google added llms.txt to its own docs and (per one thread) into Lighthouse audits has reopened the debate.
- Nobody on Reddit references a scored leaderboard. Closest praise goes to directory.llmstxt.cloud as a *discovery* tool, never as a grader.

## 4. Does a scored leaderboard exist today?

No. Every directory found (llms-txt-hub, directory.llmstxt.cloud, llmstxt.site, llms-txt.io, Awesome-llms-txt) sorts alphabetically or by raw token count. Validators (llmstxtchecker, llms-txt.io/validator, Hostinger, MRS) return per-file pass/fail with no comparative score, no rank, no history. The llmstxt-hub README markets itself as "the largest directory" — never as a leaderboard. There is no Lighthouse-equivalent.

## 5. Positioning gap

The space has a spec, ~5 directories, ~8 validators, and ~3 generators — but zero scored, category-grouped, diff-tracked leaderboards. The closest competitor is **directory.llmstxt.cloud** (1,600+ entries, category filters, token sort) but it explicitly does not grade. A Lighthouse-style scorecard that grades spec compliance, doc completeness, freshness, size discipline, and link health — grouped by category (devtools / docs / SaaS / fintech) with weekly diffs — is unoccupied. It also lands at the perfect moment: the May-2026 Google Lighthouse / Google docs adoption signal has shifted Reddit and HN from "scam" to "maybe matters" — exactly the inflection where an objective scorecard becomes the authority everyone cites.
