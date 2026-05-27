# Maintainers

The leaderboard is run by a small team. We are listed here so appeals and rubric proposals have humans to address.

## Active maintainers

| GitHub | Areas | Joined |
|--------|-------|--------|
| [@zriyansh](https://github.com/zriyansh) | scoring tool, rubric, infra | 2026-05 |

## Trusted contributors

People who have merged ≥ 3 PRs and earned commit access on `tools/` or `scripts/`. Empty at launch — that's a state we'd like to change. Open a PR and start a relationship.

## What maintainers actually do

- **Review PRs** within seven days. CI does the heavy lifting (re-runs `llms-txt-score` and compares to committed `score.json`); a human checks Voice (2 pts), display-name, and category.
- **Triage appeals** publicly on the issue tracker. Quote the rubric, point to the file, decide on the issue. Closed appeals stay open for reference.
- **Run the monthly crawl PR**. The cron opens it; a maintainer reviews the diff, manually closes false-positive regressions, and merges.
- **Quarterly rubric review** (Jan, Apr, Jul, Oct). Batch any approved `rubric:` proposals, bump `schema_version`, re-score the corpus, ship the diff.

## What maintainers don't do

- Hand out grade bumps in exchange for sponsorships. No.
- Move weights to flatter a specific vendor. The rubric is public for a reason.
- Hide a site at a vendor's request. If you'd rather not be on the leaderboard, take down your `llms.txt`.

## How to join

1. Merge three PRs (new sites or scoring-tool patches).
2. Open an issue titled `maintainer: <your-github-handle>` describing what part you'd want to look after.
3. Existing maintainers vote on the issue. Two approvals = in.

## Contact

For things that genuinely cannot be public (security disclosures on the scoring tool, takedown notices), open a private security advisory on GitHub. Everything else goes on the issue tracker.

## Governance trail

The rubric we ship at launch was synthesised from research subagents A through G in [`research/`](./research/). When the rubric changes, the diff to `RUBRIC.md` and the `schema_version` bump in `score.json` are the trail.
