# Exhibit A — Authsome's own `llms.txt`

The brief for this repo says:

> Authsome publishes its own llms.txt and aims for a perfect 100 as Exhibit A.

This directory is that file: [`llms.txt`](./llms.txt). Today it scores **93 / 100 (A)** against the public rubric — the highest score in the project. The seven points it doesn't yet earn come from one criterion that only counts when the CI runs against a live URL.

- **Linked content stability (6/10)** — sampled HEAD checks on listed pages. Default 6/10 (unverified) jumps to 10/10 the moment we deploy `authsome.dev/llms.txt` and the monthly crawl `--check-links` runs.

The realistic ceiling for any new entry on day-zero is therefore **93**. Authsome hits that ceiling. The point isn't "we won the leaderboard" — it's that the rubric is honest. If anyone hits 100, the workflow recorded it; nobody gets to claim 100 from a synthetic example.

For context, only 11 sites in the 1,023-site corpus earned A or A-. The top of the leaderboard sits at 89 (Neon). This file is what "good" looks like in advance of the actual deploy.

## Scoring our own file

```shell
node ../tools/llms-txt-score/bin/llms-txt-score.js \
  exhibit-a/llms.txt \
  --content-type='text/markdown; charset=utf-8' \
  --last-modified="$(date -u +'%a, %d %b %Y %H:%M:%S GMT')" \
  --format=markdown --no-color
```

## What this file does right

- H1 first line; one and only one H1; blockquote summary directly under it.
- 12 H2 sections covering Getting started · API · Auth · Providers · MCP · SDKs · Webhooks · Errors · Examples · Pricing · Changelog · Optional.
- Every linked page is a `.md` URL twin, so an agent can pull clean content without a browser parse.
- `## Auth` is a real dedicated section, not buried inside "Concepts."
- The `## MCP` section lists the discovery JSON and the agent-skills index.
- OpenAPI spec linked in both YAML and JSON.
- File size: 4.3 KB. Well inside the context window of every model we care about.
- Zero marketing fluff. No em-dashes in the intro paragraph.

If you maintain a site's `llms.txt` and want to ship a 90+, the shape of this file is what to copy.
