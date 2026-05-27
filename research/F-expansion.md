# F. Corpus expansion

Push the accepted corpus from **91** to **1,024** production `llms.txt` files, well past the 200+ launch bar.

## Method

1. Harvested candidate domains from three curated indexes:
   - `directory.llmstxt.cloud` (paginated, 90+ entries scraped via WebFetch).
   - `github.com/SecretiveShell/Awesome-llms-txt` (raw README, 604 unique hosts).
   - `github.com/thedaviddias/llms-txt-hub` (raw 406 KB README, 1,143 unique `/llms.txt` URLs).
2. Merged to a single host list (1,346 unique). Deduped against the 143 already attempted (`results.json`), yielding **1,288** fresh candidates.
3. Restricted the fetch set to candidates that pass a structural sniff test (`docs.*`, `developer(s).*`, `api.*`, `www.*`, or a sensible TLD) to skip obvious junk. Final fetch set: **1,132**.
4. Fetched all of them in parallel (`xargs -P 30`, 10 s timeout, 3 redirects) via the same `fetch.sh` flow used for the seed pass. Wrote raw bodies to `raw_expansion/` and meta to `meta_expansion/`.
5. Re-scored every row with the existing rubric in `build_results.py` (HTTP 200, size > 50 B, `text/*` content-type, body must not start with `<`).
6. Copied the 933 accepted raw bodies into `raw/`, appended all 1,131 evaluated rows to `results.json` with `source: "expansion"`.

## Results

| Metric | Value |
| --- | --- |
| Candidates fetched | 1,131 |
| Newly accepted | **933** |
| Rejected (HTTP / HTML / empty) | 198 |
| Acceptance rate | 82.5% |
| Cumulative accepted corpus | **1,024** |

### Reject reasons (top)

- `http_404` — 74
- `http_0` (connection failed / DNS) — 52
- `html_body` (server returned HTML at `/llms.txt`) — 37
- `http_403` — 24
- Other (429 / 503 / 525 / 307 / 400 / 502) — 7

### Source attribution for accepted rows (overlap allowed)

- `llms-txt-hub` (thedaviddias) — 780
- `awesome-llms-txt` (SecretiveShell) — 434
- `directory.llmstxt.cloud` — 72
- other / cross-listed — 2

GitHub code search and ad-hoc WebSearch were planned but the curated indexes already exceeded the 60–100 target by an order of magnitude, so the remaining channels are deferred.

## Top 10 most interesting additions

1. **docs.adyen.com** — global payments, 2,446 indexed links. Largest enterprise-grade brand we picked up.
2. **docs.retool.com** — internal-tool builder, 1,073 links.
3. **docs.deno.com** — Deno runtime, official docs.
4. **docs.expo.dev** — Expo / React Native, 780 links.
5. **docs.netlify.com** — first-party Netlify docs (the seed only had `netlify.com`).
6. **js.langchain.com** — LangChain JS reference, 1,363 links.
7. **docs.medusajs.com** + **docs.commercelayer.io** + **docs.vendure.io** — headless commerce trifecta we were missing.
8. **docs.scrapfly.io** + **docs.brightdata.com** — scraping/proxy infrastructure, an entire vertical absent from the seed.
9. **docs.weka.io** + **docs.redpanda.com** + **docs.ionos.com** — enterprise infrastructure (storage, streaming, hosting).
10. **docs.dynamic.xyz** + **developer.tryfinch.com** + **docs.sardine.ai** + **docs.useparagon.com** — fintech / identity / embedded-integration cluster.

Honourable mentions: `nuxt.com`, `vite.dev`, `clerk.com`, `docs.adyen.com`, `docs.comfy.org` (ComfyUI), `agno.com`, `agent.ai`, `agentskills.io`, `ai-sdk.dev`, `ai.pydantic.dev`, `angular.dev`, `developer.onetrust.com`, `docs.langwatch.ai`, `docs.keeper.io`, `docs.videosdk.live`.

## Files written

- `raw/<domain>.txt` — 933 new bodies.
- `results.json` — 1,131 new rows appended (`source: "expansion"`).
- `expansion_rows.json` — intermediate per-row evaluation (kept for audit).
- `raw_expansion/`, `meta_expansion/` — staging dirs, retained for traceability.
