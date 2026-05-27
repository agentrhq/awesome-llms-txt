# Awesome `llms.txt` [![Awesome](https://awesome.re/badge.svg)](https://awesome.re/)

> The scored leaderboard of `llms.txt` quality. Like [Lighthouse](https://developer.chrome.com/docs/lighthouse/), but for the file that tells agents what your site can do.

[![Sites scored](https://img.shields.io/badge/sites_scored-1016-blue.svg)](./docs/leaderboard.json)
[![Avg score](https://img.shields.io/badge/avg_score-58-yellow.svg)](./RUBRIC.md)
[![A grades](https://img.shields.io/badge/A_grades-3-brightgreen.svg)](#top-25)
[![License: CC0-1.0](https://img.shields.io/badge/data-CC0--1.0-lightgrey.svg)](./LICENSE)

The public leaderboard of `llms.txt` quality. We scored **1,016 production files**. Stripe scored **69**. Vercel scored **71**. Anthropic Docs scored **68**. Only **3** sites earned an **A**. What's your score?

## Contents

- [How scores are calculated](#how-scores-are-calculated)
- [Headline numbers](#headline-numbers)
- [Top 25](#top-25)
- [Lowest scorers (each is a 5-minute fix)](#lowest-scorers-each-is-a-5-minute-fix)
- [By category](#by-category)
- [Methodology in detail](#methodology-in-detail)
- [Score your own site](#score-your-own-site)
- [Embed the badge](#embed-the-badge)
- [Contributing](#contributing)
- [What this is and isn't](#what-this-is-and-isnt)

## How scores are calculated

**Every score is produced by code, not by a human.** No editorial picks. The grading is done by a parser that walks the file structure and a scorer that applies ten weighted rules. The full rubric is in [`RUBRIC.md`](./RUBRIC.md). The tool source is in [`tools/llms-txt-score/`](./tools/llms-txt-score/).

If you want the same number we got, run:

```shell
npx llms-txt-score https://your-site.com/llms.txt --format=markdown
```

What the ten criteria look at, summarised:

| Weight | Criterion | What the code checks |
|------:|---|---|
| 20 | Coverage | H2 section count, value-weighted link count (links to `/blog/`, `/case-study/`, `/press/`, `/careers/`, `/legal/` are discounted), and presence of canonical section names like `Docs`, `API`, `Quickstart`, `Auth`. |
| 18 | Spec compliance | Is the H1 the first line? Is there exactly one H1? Is there a `> blockquote` summary? Are the link bullets well-formed (`- [name](url): note`)? Hard floor of 6 points if no H1. |
| 14 | Agent-action declarations | Does it link to an `llms-full.txt` companion? Are most links `.md` URL twins? Does it mention MCP, `/.well-known/`, OpenAPI? |
| 10 | Linked-content stability | Sampled HEAD requests on 8 random links from the file. Default 6 / 10 when not yet run live (CI re-runs every month). |
| 10 | Freshness | Age of the `Last-Modified` HTTP header. ≤7 days = 10, ≤30 = 9, ≤90 = 7, ≤180 = 5, ≤365 = 3, older = 1. Default 5 when the server doesn't emit the header. |
|  8 | Discoverability | Does `/llms.txt` return HTTP 200? Is there a redirect chain? Is it behind auth? |
|  8 | Auth signposting | Auth keywords (`auth`, `OAuth`, `API key`, `Bearer`) + a dedicated `## Auth` / `### Authentication` / `## Credentials` / `## Access` section. |
|  6 | Size discipline | File-size buckets. Under 8 KB = 6 / 6, under 32 KB = 5, under 64 KB = 4, anything over 512 KB = 0. Twilio's 2.2 MB file zeroes here. |
|  4 | Content-Type & encoding | `text/markdown` or `text/plain`, UTF-8 declared. A mojibake check (encoding gone wrong) docks 1 point. |
|  2 | Voice | A small marketing-phrase keyword list (`industry-leading`, `revolutionary`, etc.) and an em-dash check in the intro paragraph. Tiebreaker only. |

Grade bands borrowed from Mozilla HTTP Observatory and capped at 100: **A+** ≥ 95, **A** ≥ 85, **A-** ≥ 80, **B+** ≥ 75, **B** ≥ 65, **C** ≥ 50, **D** ≥ 35, **F** < 35. `A` at 85 matches Lighthouse's "green" threshold so screenshots are instantly legible to anyone who's seen a PageSpeed report.

No site can claim a different score by emailing us. The tool is the answer. If you think the rubric is wrong, file a [public appeal](./CONTRIBUTING.md#appeals). If you think your file is being parsed incorrectly, file a [tool bug](./tools/llms-txt-score/). Either gets debated on the issue, not in DM.

## Headline numbers

- **1,016** accepted `llms.txt` files. We attempted **1,275** and rejected the rest for 404, HTML body, redirect chains, or auth walls.
- **3** sites earned an **A** grade. Top of the leaderboard: **[Neon](./sites/neon.tech/)** at **89**.
- Average score: **58 / 100**. Median: **58**.
- Grade distribution: A=3 · A-=7 · B+=51 · B=231 · C=535 · D=144 · F=45.
- Real `Last-Modified` data on **553 / 1016** sites (54%). The rest score the neutral 5 / 10 default on Freshness until they emit the header.

## Top 25

| # | Site | Domain | Score | Grade | Category | Size |
|---|------|--------|------:|:-----:|----------|-----:|
| 1 | [Neon](./sites/neon.tech/) | `neon.tech` | 89 | **A** | Data | 27.1 KB |
| 2 | [Convex Documentation](./sites/docs.convex.dev/) | `docs.convex.dev` | 86 | **A** | Data | 37.4 KB |
| 3 | [Resend](./sites/resend.com/) | `resend.com` | 85 | **A** | Comms | 5.5 KB |
| 4 | [Openfort](./sites/www.openfort.io/) | `www.openfort.io` | 82 | **A-** | Auth | 4.6 KB |
| 5 | [Zapier Docs](./sites/docs.zapier.com/) | `docs.zapier.com` | 82 | **A-** | Developer tools | 38.6 KB |
| 6 | [Apify Documentation](./sites/docs.apify.com/) | `docs.apify.com` | 81 | **A-** | Infra | 84.5 KB |
| 7 | [PostHog](./sites/posthog.com/) | `posthog.com` | 81 | **A-** | Observability | 277.6 KB |
| 8 | [Keito](./sites/keito.ai/) | `keito.ai` | 80 | **A-** | AI platforms | 8.0 KB |
| 9 | [Venice API](./sites/docs.venice.ai/) | `docs.venice.ai` | 80 | **A-** | AI platforms | 15.0 KB |
| 10 | [X Developer Platform](./sites/docs.x.com/) | `docs.x.com` | 80 | **A-** | Comms | 3.1 KB |
| 11 | [Apify](./sites/apify.com/) | `apify.com` | 79 | **B+** | Infra | 11.8 KB |
| 12 | [Linear](./sites/linear.app/) | `linear.app` | 79 | **B+** | Developer tools | 9.2 KB |
| 13 | [Remult](./sites/remult.dev/) | `remult.dev` | 79 | **B+** | Developer tools | 26.1 KB |
| 14 | [Adyen Docs](./sites/docs.adyen.com/) | `docs.adyen.com` | 78 | **B+** | Billing | 389.4 KB |
| 15 | [Better Auth](./sites/better-auth.com/) | `better-auth.com` | 78 | **B+** | Auth | 21.7 KB |
| 16 | [Deployhq](./sites/www.deployhq.com/) | `www.deployhq.com` | 78 | **B+** | Infra | 117.4 KB |
| 17 | [Formo Docs](./sites/docs.formo.so/) | `docs.formo.so` | 78 | **B+** | Observability | 25.9 KB |
| 18 | [Mangopay docs](./sites/docs.mangopay.com/) | `docs.mangopay.com` | 78 | **B+** | Billing | 54.9 KB |
| 19 | [Nitro](./sites/nitro.build/) | `nitro.build` | 78 | **B+** | Developer tools | 9.7 KB |
| 20 | [Nuxt Docs](./sites/nuxt.com/) | `nuxt.com` | 78 | **B+** | Developer tools | 50.7 KB |
| 21 | [Parallel](./sites/docs.parallel.ai/) | `docs.parallel.ai` | 78 | **B+** | AI platforms | 19.7 KB |
| 22 | [Plan Harmony](./sites/planharmony.com/) | `planharmony.com` | 78 | **B+** | Developer tools | 69.3 KB |
| 23 | [Redis Documentation](./sites/redis.io/) | `redis.io` | 78 | **B+** | Data | 45.8 KB |
| 24 | [Scrapfly Documentation](./sites/docs.scrapfly.io/) | `docs.scrapfly.io` | 78 | **B+** | Infra | 22.5 KB |
| 25 | [Uithing](./sites/uithing.com/) | `uithing.com` | 78 | **B+** | Developer tools | 31.5 KB |

[Full table (1,016 rows) →](./docs/leaderboard.json) · [Sortable web view →](https://agentrhq.github.io/awesome-llms-txt/) <!-- pages -->

## Lowest scorers (each is a 5-minute fix)

Recognisable sites that landed at D or F. Almost every entry here is one of: no H1, no `> blockquote` summary, no `## Auth` section, or a file too large to fit in a context window. Open the per-site page for the exact criterion breakdown.

| # | Site | Domain | Score | Grade | Category | Size |
|---|------|--------|------:|:-----:|----------|-----:|
| 1 | [Twilio](./sites/twilio.com/) | `twilio.com` | 27 | **F** | Comms | 2187.3 KB |
| 2 | [Notion](./sites/notion.so/) | `notion.so` | 29 | **F** | Developer tools | 6.8 KB |
| 3 | [複合機・コピー機のリースなら事務機器ねっと](./sites/jimukiki.net/) | `jimukiki.net` | 43 | **D** | Developer tools | 91.7 KB |
| 4 | [Valdhealth](./sites/valdhealth.com/) | `valdhealth.com` | 48 | **D** | Infra | 60.6 KB |
| 5 | [Cloudfix](./sites/cloudfix.com/) | `cloudfix.com` | 49 | **D** | Search | 741.3 KB |

These aren't bad teams or bad products. `llms.txt` is new, and most teams haven't prioritised it yet. Submit a re-scored PR once your file ships the change. The next monthly crawl picks it up automatically.

### Lowest 10 (whole corpus, including long-tail unknowns)

| # | Site | Domain | Score | Grade | Size |
|---|------|--------|------:|:-----:|-----:|
| 1 | [Digitalstar](./sites/www.digitalstar.lt/) | `www.digitalstar.lt` | 22 | **F** | 0.1 KB |
| 2 | [Sketchready](./sites/sketchready.com/) | `sketchready.com` | 24 | **F** | 0.1 KB |
| 3 | [Toriut](./sites/toriut.com/) | `toriut.com` | 26 | **F** | 1.7 KB |
| 4 | [Toms It](./sites/www.toms-it.at/) | `www.toms-it.at` | 26 | **F** | 179.9 KB |
| 5 | [Sealos](./sites/sealos.io/) | `sealos.io` | 26 | **F** | 431.4 KB |
| 6 | [Positrixpower](./sites/www.positrixpower.com/) | `www.positrixpower.com` | 26 | **F** | 5.1 KB |
| 7 | [Assuranceendirect](./sites/www.assuranceendirect.com/) | `www.assuranceendirect.com` | 26 | **F** | 175.9 KB |
| 8 | [Assurance Voiture Temporaire Provisoire](./sites/www.assurance-voiture-temporaire-provisoire.com/) | `www.assurance-voiture-temporaire-provisoire.com` | 26 | **F** | 389.7 KB |
| 9 | [Twilio](./sites/twilio.com/) | `twilio.com` | 27 | **F** | 2187.3 KB |
| 10 | [Tele Assistance Senior](./sites/www.tele-assistance-senior.fr/) | `www.tele-assistance-senior.fr` | 27 | **F** | 74.3 KB |

## By category

The rubric is identical for every site. Categories exist so an agent builder looking for "every comms provider with a good `llms.txt`" gets one click. Top 15 per category shown.

### AI platforms (37)

| # | Site | Domain | Score | Grade |
|---|------|--------|------:|:-----:|
| 1 | [Keito](./sites/keito.ai/) | `keito.ai` | 80 | **A-** |
| 2 | [Venice API](./sites/docs.venice.ai/) | `docs.venice.ai` | 80 | **A-** |
| 3 | [Parallel](./sites/docs.parallel.ai/) | `docs.parallel.ai` | 78 | **B+** |
| 4 | [LangChain (Python)](./sites/python.langchain.com/) | `python.langchain.com` | 75 | **B+** |
| 5 | [ComfyUI](./sites/docs.comfy.org/) | `docs.comfy.org` | 74 | **B** |
| 6 | [CrewAI Docs](./sites/docs.crewai.com/) | `docs.crewai.com` | 73 | **B** |
| 7 | [Pydantic AI](./sites/ai.pydantic.dev/) | `ai.pydantic.dev` | 73 | **B** |
| 8 | [Pinecone Docs](./sites/docs.pinecone.io/) | `docs.pinecone.io` | 72 | **B** |
| 9 | [Mastra](./sites/mastra.ai/) | `mastra.ai` | 71 | **B** |
| 10 | [deAPI](./sites/deapi.ai/) | `deapi.ai` | 70 | **B** |
| 11 | [LangChain (JS)](./sites/js.langchain.com/) | `js.langchain.com` | 70 | **B** |
| 12 | [Together AI](./sites/together.ai/) | `together.ai` | 70 | **B** |
| 13 | [Anthropic Docs](./sites/docs.anthropic.com/) | `docs.anthropic.com` | 68 | **B** |
| 14 | [Giles' Blog](./sites/www.gilesthomas.com/) | `www.gilesthomas.com` | 68 | **B** |
| 15 | [Cohere](./sites/cohere.com/) | `cohere.com` | 67 | **B** |

_See [`leaderboard.json`](./docs/leaderboard.json) for the full 37._

### Data (30)

| # | Site | Domain | Score | Grade |
|---|------|--------|------:|:-----:|
| 1 | [Neon](./sites/neon.tech/) | `neon.tech` | 89 | **A** |
| 2 | [Convex Documentation](./sites/docs.convex.dev/) | `docs.convex.dev` | 86 | **A** |
| 3 | [Redis Documentation](./sites/redis.io/) | `redis.io` | 78 | **B+** |
| 4 | [Chainbase Docs](./sites/docs.chainbase.com/) | `docs.chainbase.com` | 77 | **B+** |
| 5 | [Metabase](./sites/www.metabase.com/) | `www.metabase.com` | 77 | **B+** |
| 6 | [Finch](./sites/developer.tryfinch.com/) | `developer.tryfinch.com` | 76 | **B+** |
| 7 | [Redpanda Documentation](./sites/docs.redpanda.com/) | `docs.redpanda.com` | 74 | **B** |
| 8 | [PlanetScale](./sites/planetscale.com/) | `planetscale.com` | 70 | **B** |
| 9 | [InstantDB](./sites/instantdb.com/) | `instantdb.com` | 69 | **B** |
| 10 | [Hydrolix](./sites/hydrolix.io/) | `hydrolix.io` | 67 | **B** |
| 11 | [Equipment Python](./sites/equipment-python.vercel.app/) | `equipment-python.vercel.app` | 66 | **B** |
| 12 | [SpacetimeDB](./sites/spacetimedb.com/) | `spacetimedb.com` | 66 | **B** |
| 13 | [TiDB Documentation](./sites/docs.pingcap.com/) | `docs.pingcap.com` | 65 | **B** |
| 14 | [Upstash](./sites/upstash.com/) | `upstash.com` | 65 | **B** |
| 15 | [Pinecone](./sites/pinecone.io/) | `pinecone.io` | 64 | **C** |

_See [`leaderboard.json`](./docs/leaderboard.json) for the full 30._

### Auth (31)

| # | Site | Domain | Score | Grade |
|---|------|--------|------:|:-----:|
| 1 | [Openfort](./sites/www.openfort.io/) | `www.openfort.io` | 82 | **A-** |
| 2 | [Better Auth](./sites/better-auth.com/) | `better-auth.com` | 78 | **B+** |
| 3 | [Civic Docs](./sites/docs.civic.com/) | `docs.civic.com` | 77 | **B+** |
| 4 | [WorkOS](./sites/workos.com/) | `workos.com` | 77 | **B+** |
| 5 | [Auth0](./sites/auth0.com/) | `auth0.com` | 76 | **B+** |
| 6 | [Better Auth](./sites/www.better-auth.com/) | `www.better-auth.com` | 76 | **B+** |
| 7 | [Lifewithai](./sites/lifewithai.ai/) | `lifewithai.ai` | 76 | **B+** |
| 8 | [Unkey](./sites/www.unkey.com/) | `www.unkey.com` | 76 | **B+** |
| 9 | [Dynamic Documentation](./sites/docs.dynamic.xyz/) | `docs.dynamic.xyz` | 73 | **B** |
| 10 | [CitizenShipper](./sites/citizenshipper.com/) | `citizenshipper.com` | 71 | **B** |
| 11 | [UniWebView](./sites/docs.uniwebview.com/) | `docs.uniwebview.com` | 71 | **B** |
| 12 | [/n software](./sites/www.nsoftware.com/) | `www.nsoftware.com` | 70 | **B** |
| 13 | [ThatDeveloperGuy](./sites/thatdeveloperguy.com/) | `thatdeveloperguy.com` | 68 | **B** |
| 14 | [Keeper Documentation Portal](./sites/docs.keeper.io/) | `docs.keeper.io` | 67 | **B** |
| 15 | [Cardless ID](./sites/cardlessid.org/) | `cardlessid.org` | 66 | **B** |

_See [`leaderboard.json`](./docs/leaderboard.json) for the full 31._

### Observability (28)

| # | Site | Domain | Score | Grade |
|---|------|--------|------:|:-----:|
| 1 | [PostHog](./sites/posthog.com/) | `posthog.com` | 81 | **A-** |
| 2 | [Formo Docs](./sites/docs.formo.so/) | `docs.formo.so` | 78 | **B+** |
| 3 | [Databuddy Documentation](./sites/www.databuddy.cc/) | `www.databuddy.cc` | 75 | **B+** |
| 4 | [Contentsquare Tech Docs](./sites/docs.contentsquare.com/) | `docs.contentsquare.com` | 74 | **B** |
| 5 | [LangWatch](./sites/docs.langwatch.ai/) | `docs.langwatch.ai` | 70 | **B** |
| 6 | [Datadog](./sites/datadog.com/) | `datadog.com` | 69 | **B** |
| 7 | [Dailygoal](./sites/www.dailygoal.fit/) | `www.dailygoal.fit` | 66 | **B** |
| 8 | [Cloud Studio IoT](./sites/cloudstudioiot.com/) | `cloudstudioiot.com` | 64 | **C** |
| 9 | [jobdata API](./sites/jobdataapi.com/) | `jobdataapi.com` | 64 | **C** |
| 10 | [Rankscale](./sites/rankscale.ai/) | `rankscale.ai` | 64 | **C** |
| 11 | [New Relic](./sites/newrelic.com/) | `newrelic.com` | 63 | **C** |
| 12 | [Cloud Studio IoT](./sites/www.cloudstudioiot.com/) | `www.cloudstudioiot.com` | 62 | **C** |
| 13 | [Helicone](./sites/www.helicone.ai/) | `www.helicone.ai` | 62 | **C** |
| 14 | [Scout Monitoring](./sites/www.scoutapm.com/) | `www.scoutapm.com` | 62 | **C** |
| 15 | [Langfuse](./sites/langfuse.com/) | `langfuse.com` | 60 | **C** |

_See [`leaderboard.json`](./docs/leaderboard.json) for the full 28._

### Infra (58)

| # | Site | Domain | Score | Grade |
|---|------|--------|------:|:-----:|
| 1 | [Apify Documentation](./sites/docs.apify.com/) | `docs.apify.com` | 81 | **A-** |
| 2 | [Apify](./sites/apify.com/) | `apify.com` | 79 | **B+** |
| 3 | [Deployhq](./sites/www.deployhq.com/) | `www.deployhq.com` | 78 | **B+** |
| 4 | [Scrapfly Documentation](./sites/docs.scrapfly.io/) | `docs.scrapfly.io` | 78 | **B+** |
| 5 | [Abstract](./sites/docs.abs.xyz/) | `docs.abs.xyz` | 77 | **B+** |
| 6 | [Bright Data Docs](./sites/docs.brightdata.com/) | `docs.brightdata.com` | 74 | **B** |
| 7 | [Docker Docs](./sites/docs.docker.com/) | `docs.docker.com` | 74 | **B** |
| 8 | [Juno](./sites/juno.build/) | `juno.build` | 74 | **B** |
| 9 | [Paragon Documentation](./sites/docs.useparagon.com/) | `docs.useparagon.com` | 74 | **B** |
| 10 | [Community Charts](./sites/community-charts.github.io/) | `community-charts.github.io` | 73 | **B** |
| 11 | [Kernel Error](./sites/www.kernel-error.de/) | `www.kernel-error.de` | 73 | **B** |
| 12 | [xmcp](./sites/xmcp.dev/) | `xmcp.dev` | 72 | **B** |
| 13 | [Documentation](./sites/vercel.com/) | `vercel.com` | 71 | **B** |
| 14 | [Cloudflare](./sites/cloudflare.com/) | `cloudflare.com` | 70 | **B** |
| 15 | [Injective Docs](./sites/docs.injective.network/) | `docs.injective.network` | 70 | **B** |

_See [`leaderboard.json`](./docs/leaderboard.json) for the full 58._

### Comms (42)

| # | Site | Domain | Score | Grade |
|---|------|--------|------:|:-----:|
| 1 | [Resend](./sites/resend.com/) | `resend.com` | 85 | **A** |
| 2 | [X Developer Platform](./sites/docs.x.com/) | `docs.x.com` | 80 | **A-** |
| 3 | [Upsun](./sites/docs.upsun.com/) | `docs.upsun.com` | 73 | **B** |
| 4 | [Upsun Fixed](./sites/docs.platform.sh/) | `docs.platform.sh` | 72 | **B** |
| 5 | [Agoragentic Triptych OS (Agent OS)](./sites/agoragentic.com/) | `agoragentic.com` | 71 | **B** |
| 6 | [Postmark](./sites/postmark.com/) | `postmark.com` | 69 | **B** |
| 7 | [FlowRunner](./sites/flow-runner.com/) | `flow-runner.com` | 68 | **B** |
| 8 | [Bika](./sites/bika.ai/) | `bika.ai` | 67 | **B** |
| 9 | [DreamHost](./sites/www.dreamhost.com/) | `www.dreamhost.com` | 67 | **B** |
| 10 | [Abstract API](./sites/abstractapi.com/) | `abstractapi.com` | 66 | **B** |
| 11 | [Claude](./sites/claude.com/) | `claude.com` | 66 | **B** |
| 12 | [Loops](./sites/loops.so/) | `loops.so` | 66 | **B** |
| 13 | [Ultiplace](./sites/www.ultiplace.com/) | `www.ultiplace.com` | 64 | **C** |
| 14 | [Inbox SuperPilot](./sites/inboxsuperpilot.com/) | `inboxsuperpilot.com` | 63 | **C** |
| 15 | [Automatio](./sites/automatio.ai/) | `automatio.ai` | 62 | **C** |

_See [`leaderboard.json`](./docs/leaderboard.json) for the full 42._

### Docs platforms (1)

| # | Site | Domain | Score | Grade |
|---|------|--------|------:|:-----:|
| 1 | [GitBook Docs](./sites/docs.gitbook.com/) | `docs.gitbook.com` | 71 | **B** |

### Billing (28)

| # | Site | Domain | Score | Grade |
|---|------|--------|------:|:-----:|
| 1 | [Adyen Docs](./sites/docs.adyen.com/) | `docs.adyen.com` | 78 | **B+** |
| 2 | [Mangopay docs](./sites/docs.mangopay.com/) | `docs.mangopay.com` | 78 | **B+** |
| 3 | [포트원 개발자센터 문서](./sites/developers.portone.io/) | `developers.portone.io` | 78 | **B+** |
| 4 | [TestingBot Documentation](./sites/testingbot.com/) | `testingbot.com` | 76 | **B+** |
| 5 | [Unlock SaaS](./sites/unlocksaas.com/) | `unlocksaas.com` | 74 | **B** |
| 6 | [Cursor Documentation](./sites/cursor.com/) | `cursor.com` | 71 | **B** |
| 7 | [VibeBot](./sites/www.vibebot.gg/) | `www.vibebot.gg` | 71 | **B** |
| 8 | [Stripe](./sites/stripe.com/) | `stripe.com` | 69 | **B** |
| 9 | [Stripe Docs](./sites/docs.stripe.com/) | `docs.stripe.com` | 69 | **B** |
| 10 | [AgentGrade](./sites/agentgrade.com/) | `agentgrade.com` | 68 | **B** |
| 11 | [Criticaster](./sites/www.criticaster.com/) | `www.criticaster.com` | 66 | **B** |
| 12 | [iSmartSync](./sites/ismartsync.com/) | `ismartsync.com` | 64 | **C** |
| 13 | [VoidMob](./sites/voidmob.com/) | `voidmob.com` | 63 | **C** |
| 14 | [Latuos](./sites/latuos.com/) | `latuos.com` | 62 | **C** |
| 15 | [About](./sites/blog.zithara.com/) | `blog.zithara.com` | 60 | **C** |

_See [`leaderboard.json`](./docs/leaderboard.json) for the full 28._

### Commerce (23)

| # | Site | Domain | Score | Grade |
|---|------|--------|------:|:-----:|
| 1 | [Glood Docs](./sites/docs.glood.ai/) | `docs.glood.ai` | 72 | **B** |
| 2 | [Commerce Layer Docs](./sites/docs.commercelayer.io/) | `docs.commercelayer.io` | 71 | **B** |
| 3 | [Medusa Docs](./sites/docs.medusajs.com/) | `docs.medusajs.com` | 70 | **B** |
| 4 | [Kraemer & Kraemer](./sites/kraemerlaw.com/) | `kraemerlaw.com` | 69 | **B** |
| 5 | [Front-Commerce Developers](./sites/developers.front-commerce.com/) | `developers.front-commerce.com` | 67 | **B** |
| 6 | [Inrō](./sites/www.inro.social/) | `www.inro.social` | 66 | **B** |
| 7 | [Performance Plus Tire](./sites/www.performanceplustire.com/) | `www.performanceplustire.com` | 66 | **B** |
| 8 | [Trueprofit](./sites/trueprofit.io/) | `trueprofit.io` | 65 | **B** |
| 9 | [Vendure Docs](./sites/docs.vendure.io/) | `docs.vendure.io` | 65 | **B** |
| 10 | [Medusa](./sites/medusajs.com/) | `medusajs.com` | 63 | **C** |
| 11 | [Parcelcube](./sites/parcelcube.com/) | `parcelcube.com` | 62 | **C** |
| 12 | [Bitcoin](./sites/www.bitcoin.com/) | `www.bitcoin.com` | 61 | **C** |
| 13 | [Truststvincent](./sites/truststvincent.com/) | `truststvincent.com` | 61 | **C** |
| 14 | [Handbook](./sites/handbook.exemplar.dev/) | `handbook.exemplar.dev` | 60 | **C** |
| 15 | [Zenbaki Inventory](./sites/www.zenbaki-inventory.com/) | `www.zenbaki-inventory.com` | 60 | **C** |

_See [`leaderboard.json`](./docs/leaderboard.json) for the full 23._

### Content (17)

| # | Site | Domain | Score | Grade |
|---|------|--------|------:|:-----:|
| 1 | [DexPaprika API](./sites/docs.dexpaprika.com/) | `docs.dexpaprika.com` | 77 | **B+** |
| 2 | [Visioforge](./sites/www.visioforge.com/) | `www.visioforge.com` | 74 | **B** |
| 3 | [Mux](./sites/www.mux.com/) | `www.mux.com` | 73 | **B** |
| 4 | [Akool](./sites/akool.com/) | `akool.com` | 69 | **B** |
| 5 | [Weather](./sites/weather.com/) | `weather.com` | 68 | **B** |
| 6 | [Quodat](./sites/quodat.com/) | `quodat.com` | 62 | **C** |
| 7 | [Video SDK](./sites/docs.videosdk.live/) | `docs.videosdk.live` | 61 | **C** |
| 8 | [FinalBit](./sites/www.finalbitai.com/) | `www.finalbitai.com` | 59 | **C** |
| 9 | [Truffle](./sites/www.hiretruffle.com/) | `www.hiretruffle.com` | 58 | **C** |
| 10 | [Default Store View](./sites/www.expodisplays.ca/) | `www.expodisplays.ca` | 56 | **C** |
| 11 | [Qeeebo](./sites/qeeebo.com/) | `qeeebo.com` | 56 | **C** |
| 12 | [PrompTessor](./sites/promptessor.com/) | `promptessor.com` | 55 | **C** |
| 13 | [ShowsWatched](./sites/showswatched.com/) | `showswatched.com` | 55 | **C** |
| 14 | [Tagshop](./sites/tagshop.ai/) | `tagshop.ai` | 55 | **C** |
| 15 | [Doc2lang](./sites/doc2lang.com/) | `doc2lang.com` | 51 | **C** |

_See [`leaderboard.json`](./docs/leaderboard.json) for the full 17._

### Search (6)

| # | Site | Domain | Score | Grade |
|---|------|--------|------:|:-----:|
| 1 | [Meilisearch](./sites/www.meilisearch.com/) | `www.meilisearch.com` | 73 | **B** |
| 2 | [LLMrefs](./sites/llmrefs.com/) | `llmrefs.com` | 63 | **C** |
| 3 | [Listennotes](./sites/www.listennotes.com/) | `www.listennotes.com` | 60 | **C** |
| 4 | [Not Human Search](./sites/nothumansearch.ai/) | `nothumansearch.ai` | 54 | **C** |
| 5 | [Pixaura](./sites/www.pixaura.com/) | `www.pixaura.com` | 52 | **C** |
| 6 | [Cloudfix](./sites/cloudfix.com/) | `cloudfix.com` | 49 | **D** |

### Developer tools (715)

| # | Site | Domain | Score | Grade |
|---|------|--------|------:|:-----:|
| 1 | [Zapier Docs](./sites/docs.zapier.com/) | `docs.zapier.com` | 82 | **A-** |
| 2 | [Linear](./sites/linear.app/) | `linear.app` | 79 | **B+** |
| 3 | [Remult](./sites/remult.dev/) | `remult.dev` | 79 | **B+** |
| 4 | [Nitro](./sites/nitro.build/) | `nitro.build` | 78 | **B+** |
| 5 | [Nuxt Docs](./sites/nuxt.com/) | `nuxt.com` | 78 | **B+** |
| 6 | [Plan Harmony](./sites/planharmony.com/) | `planharmony.com` | 78 | **B+** |
| 7 | [Uithing](./sites/uithing.com/) | `uithing.com` | 78 | **B+** |
| 8 | [Datafold](./sites/docs.datafold.com/) | `docs.datafold.com` | 77 | **B+** |
| 9 | [Docs](./sites/docs.flowx.ai/) | `docs.flowx.ai` | 77 | **B+** |
| 10 | [GitHub](./sites/github.com/) | `github.com` | 77 | **B+** |
| 11 | [Hyperline](./sites/docs.hyperline.co/) | `docs.hyperline.co` | 77 | **B+** |
| 12 | [Perplexity](./sites/docs.perplexity.ai/) | `docs.perplexity.ai` | 77 | **B+** |
| 13 | [Side Copilot](./sites/sidespace.app/) | `sidespace.app` | 77 | **B+** |
| 14 | [Coinbase Developer Documentation](./sites/docs.cdp.coinbase.com/) | `docs.cdp.coinbase.com` | 76 | **B+** |
| 15 | [Expo Docs](./sites/docs.expo.dev/) | `docs.expo.dev` | 76 | **B+** |

_See [`leaderboard.json`](./docs/leaderboard.json) for the full 715._


## Methodology in detail

For the short version, see [How scores are calculated](#how-scores-are-calculated) at the top of this page. For the longer version (every weight, every rationale, what we explicitly *don't* score), read [`RUBRIC.md`](./RUBRIC.md).

The rubric is refreshed monthly via [`.github/workflows/crawl.yml`](./.github/workflows/crawl.yml). Score drops auto-open an issue tagged `regression`; score rises auto-open a PR. Rubric weights themselves are revisited quarterly (Jan, Apr, Jul, Oct) so historic scores stay comparable across crawls.

## Score your own site

```shell
npx llms-txt-score https://your-site.com/llms.txt
```

```shell
npx llms-txt-score https://your-site.com/llms.txt --format=markdown
```

```shell
npx llms-txt-score https://your-site.com/llms.txt > score.json
```

Zero runtime dependencies. Node ≥ 18. Tool source: [`tools/llms-txt-score/`](./tools/llms-txt-score/).

## Embed the badge

Every scored site has its own SVG badge at `web/badge/<domain>.svg`. Drop this in your project README:

```markdown
[![llms.txt score](https://raw.githubusercontent.com/agentrhq/awesome-llms-txt/main/docs/badge/your-site.com.svg)](https://github.com/agentrhq/awesome-llms-txt/tree/main/sites/your-site.com)
```

The badge color tracks the grade (green for A, red for F). Re-scored monthly. The badge updates automatically.

## Contributing

PRs welcome. One PR per site. See [`CONTRIBUTING.md`](./CONTRIBUTING.md). Manual score edits are auto-rejected. CI re-runs the tool and compares.

Appeals (public): file an issue using the [appeal template](./.github/ISSUE_TEMPLATE/appeal.yml). Rubric proposals (reviewed quarterly): file an issue with the `rubric` label.

Maintainers: see [`MAINTAINERS.md`](./MAINTAINERS.md). Code of conduct: see [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).

## What this is and isn't

- This is a **scored** leaderboard. It is not a pass / fail validator. The [llms.txt spec](https://llmstxt.org/) covers what a valid file looks like.
- This is not a directory. [`directory.llmstxt.cloud`](https://directory.llmstxt.cloud/) and [`llms-txt-hub`](https://github.com/thedaviddias/llms-txt-hub) do that.
- This is not an opinion on whether `llms.txt` should exist. We grade what's published.
- This is not endorsed by Answer.AI, Jeremy Howard, or any of the listed sites.

## Reference llms.txt

If you want a worked example of "what good looks like," open the top of the leaderboard. [Neon](./sites/neon.tech/) at **89 (A)** is the strongest real-world file in the corpus: H1 first line, blockquote summary, 19 H2 sections, 185 links (most are `.md` URL twins), dedicated auth signposting.

---

Data licensed [CC0-1.0](./LICENSE). Tool source [MIT](./tools/llms-txt-score/LICENSE).
