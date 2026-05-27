#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'leaderboard.json'), 'utf8'));
const stats = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'stats.json'), 'utf8'));

const CATEGORY_LABELS = {
  'ai-platform':   'AI platforms',
  'dev-tools':     'Developer tools',
  'docs-platform': 'Docs platforms',
  'billing':       'Billing',
  'comms':         'Comms',
  'data':          'Data',
  'infra':         'Infra',
  'observability': 'Observability',
  'auth':          'Auth',
  'search':        'Search',
  'content':       'Content',
  'commerce':      'Commerce',
};

const GRADE_ORDER = ['A+', 'A', 'A-', 'B+', 'B', 'C', 'D', 'F'];

const sorted = [...manifest].sort((a, b) => b.score - a.score || a.display_name.localeCompare(b.display_name));
const top10 = sorted.slice(0, 10);
const top25 = sorted.slice(0, 25);
const bottom10 = sorted.slice(-10).reverse();
const aGraded = sorted.filter(e => e.grade === 'A' || e.grade === 'A+');
const stripeRow = manifest.find(e => e.domain === 'docs.stripe.com') || manifest.find(e => e.domain === 'stripe.com');
const vercelRow = manifest.find(e => e.domain === 'vercel.com');
const anthropicRow = manifest.find(e => e.domain === 'docs.anthropic.com');
const neonRow = sorted[0];

function siteFolder(domain) { return `./sites/${domain.replace(/[^a-zA-Z0-9._-]/g, '_')}/`; }

function row(e, i) {
  const folder = siteFolder(e.domain);
  return `| ${i + 1} | [${e.display_name}](${folder}) | \`${e.domain}\` | ${e.score} | **${e.grade}** | ${CATEGORY_LABELS[e.category] || e.category} | ${(e.file_size_bytes / 1024).toFixed(1)} KB |`;
}

function shortRow(e, i) {
  const folder = siteFolder(e.domain);
  return `| ${i + 1} | [${e.display_name}](${folder}) | ${e.score} | **${e.grade}** |`;
}

const byCategory = {};
for (const e of sorted) (byCategory[e.category] ||= []).push(e);

function categoryBlock(cat) {
  const label = CATEGORY_LABELS[cat] || cat;
  const list = (byCategory[cat] || []).slice(0, 15);
  if (list.length === 0) return '';
  const rows = list.map((e, i) => `| ${i + 1} | [${e.display_name}](${siteFolder(e.domain)}) | \`${e.domain}\` | ${e.score} | **${e.grade}** |`).join('\n');
  const total = byCategory[cat].length;
  const more = total > 15 ? `\n\n_See [\`leaderboard.json\`](./docs/leaderboard.json) for the full ${total}._` : '';
  return `### ${label} (${total})\n\n| # | Site | Domain | Score | Grade |\n|---|------|--------|------:|:-----:|\n${rows}${more}\n`;
}

const distLine = GRADE_ORDER
  .filter(g => stats.dist[g])
  .map(g => `${g}=${stats.dist[g]}`)
  .join(' · ');

const hookCount = `${stats.total.toLocaleString()}`;

const hook = `The public leaderboard of \`llms.txt\` quality. We scored **${hookCount} production files**. Stripe scored **${stripeRow.score}**. Vercel scored **${vercelRow.score}**. Anthropic Docs scored **${anthropicRow.score}**. Only **${aGraded.length}** sites earned an **A**. What's your score?`;

const intro = `# Awesome \`llms.txt\` [![Awesome](https://awesome.re/badge.svg)](https://awesome.re/)

> The scored leaderboard of \`llms.txt\` quality. Like [Lighthouse](https://developer.chrome.com/docs/lighthouse/), but for the file that tells agents what your site can do.

[![Sites scored](https://img.shields.io/badge/sites_scored-${stats.total}-blue.svg)](./docs/leaderboard.json)
[![Avg score](https://img.shields.io/badge/avg_score-${stats.avg}-yellow.svg)](./RUBRIC.md)
[![A grades](https://img.shields.io/badge/A_grades-${aGraded.length}-brightgreen.svg)](#top-25)
[![License: CC0-1.0](https://img.shields.io/badge/data-CC0--1.0-lightgrey.svg)](./LICENSE)

${hook}

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

**Every score is produced by code, not by a human.** No editorial picks, no "we think this is bad" — just a parser walking the file structure and a scorer applying ten weighted rules. The rubric is published in full at [\`RUBRIC.md\`](./RUBRIC.md) and the tool source is at [\`tools/llms-txt-score/\`](./tools/llms-txt-score/).

If you want the same number we got, run:

\`\`\`shell
npx llms-txt-score https://your-site.com/llms.txt --format=markdown
\`\`\`

What the ten criteria look at, summarised:

| Weight | Criterion | What the code checks |
|------:|---|---|
| 20 | Coverage | H2 section count, value-weighted link count (links to \`/blog/\`, \`/case-study/\`, \`/press/\`, \`/careers/\`, \`/legal/\` are discounted), and presence of canonical section names like \`Docs\`, \`API\`, \`Quickstart\`, \`Auth\`. |
| 18 | Spec compliance | Is the H1 the first line? Is there exactly one H1? Is there a \`> blockquote\` summary? Are the link bullets well-formed (\`- [name](url): note\`)? Hard floor of 6 points if no H1. |
| 14 | Agent-action declarations | Does it link to an \`llms-full.txt\` companion? Are most links \`.md\` URL twins? Does it mention MCP, \`/.well-known/\`, OpenAPI? |
| 10 | Linked-content stability | Sampled HEAD requests on 8 random links from the file. Default 6 / 10 when not yet run live (CI re-runs every month). |
| 10 | Freshness | Age of the \`Last-Modified\` HTTP header. ≤7 days = 10, ≤30 = 9, ≤90 = 7, ≤180 = 5, ≤365 = 3, older = 1. Default 5 when the server doesn't emit the header. |
|  8 | Discoverability | Does \`/llms.txt\` return HTTP 200? Is there a redirect chain? Is it behind auth? |
|  8 | Auth signposting | Auth keywords (\`auth\`, \`OAuth\`, \`API key\`, \`Bearer\`) + a dedicated \`## Auth\` / \`### Authentication\` / \`## Credentials\` / \`## Access\` section. |
|  6 | Size discipline | File-size buckets. Under 8 KB = 6 / 6, under 32 KB = 5, under 64 KB = 4, anything over 512 KB = 0. Twilio's 2.2 MB file zeroes here. |
|  4 | Content-Type & encoding | \`text/markdown\` or \`text/plain\`, UTF-8 declared. A mojibake check (encoding gone wrong) docks 1 point. |
|  2 | Voice | A small marketing-phrase keyword list (\`industry-leading\`, \`revolutionary\`, etc.) and an em-dash check in the intro paragraph. Tiebreaker only. |

Grade bands borrowed from Mozilla HTTP Observatory and capped at 100: **A+** ≥ 95, **A** ≥ 85, **A-** ≥ 80, **B+** ≥ 75, **B** ≥ 65, **C** ≥ 50, **D** ≥ 35, **F** < 35. \`A\` at 85 matches Lighthouse's "green" threshold so screenshots are instantly legible to anyone who's seen a PageSpeed report.

**Reproducibility is the moat.** No site can claim a different score by emailing us. If you think the rubric is wrong, that's a [public appeal](./CONTRIBUTING.md#appeals). If you think your file is being parsed incorrectly, that's a [tool bug](./tools/llms-txt-score/). Either gets debated on the issue, not in DM.

## Headline numbers

- **${stats.total.toLocaleString()}** accepted \`llms.txt\` files. We attempted **1,275** and rejected the rest for 404, HTML body, redirect chains, or auth walls.
- **${aGraded.length}** sites earned an **A** grade. Top of the leaderboard: **[${neonRow.display_name}](${siteFolder(neonRow.domain)})** at **${neonRow.score}**.
- Average score: **${stats.avg} / 100**. Median: **${stats.median}**.
- Grade distribution: ${distLine}.
- Real \`Last-Modified\` data on **${stats.with_lm} / ${stats.total}** sites (${Math.round(100 * stats.with_lm / stats.total)}%). The rest score the neutral 5 / 10 default on Freshness until they emit the header.

`;

const top25section = `## Top 25

| # | Site | Domain | Score | Grade | Category | Size |
|---|------|--------|------:|:-----:|----------|-----:|
${top25.map(row).join('\n')}

[Full table (${stats.total.toLocaleString()} rows) →](./docs/leaderboard.json) · [Sortable web view →](https://agentrhq.github.io/awesome-llms-txt/) ${'<!-- pages -->'}

`;

// Notable failures: known-brand domains that scored D or F. The denylist is
// imperfect — the goal is to show recognisable names in the "shame" surface
// rather than the long tail of random submission-driven entries.
const NOTABLE_PATTERNS = [
  /^(docs?\.|developers?\.|api\.|platform\.|www\.)/i,
  /\.(dev|io|ai|tech|app|so|co)$/i,
];
const KNOWN_BRANDS = new Set([
  'twilio.com','stripe.com','docs.stripe.com','vercel.com','docs.anthropic.com','anthropic.com',
  'openai.com','platform.openai.com','github.com','docs.github.com','gitlab.com','docker.com',
  'mongodb.com','redis.io','cloudflare.com','netlify.com','docs.netlify.com','heroku.com',
  'kubernetes.io','postman.com','figma.com','linear.app','cal.com','notion.so','supabase.com',
  'cohere.com','elevenlabs.io','huggingface.co','docs.langchain.com','python.langchain.com',
  'sentry.io','newrelic.com','grafana.com','tailwindcss.com','react.dev','svelte.dev','nextjs.org',
]);
const notableFailures = sorted
  .filter(e => e.grade === 'F' || e.grade === 'D')
  .filter(e => KNOWN_BRANDS.has(e.domain) || (e.file_size_bytes > 20000 && e.link_count > 80))
  .sort((a, b) => {
    const ak = KNOWN_BRANDS.has(a.domain) ? 0 : 1;
    const bk = KNOWN_BRANDS.has(b.domain) ? 0 : 1;
    if (ak !== bk) return ak - bk;
    return a.score - b.score;
  })
  .slice(0, 10);

const bottomSection = `## Lowest scorers (each is a 5-minute fix)

Recognisable sites that landed at D or F. Almost every entry here is one of: no H1, no \`> blockquote\` summary, no \`## Auth\` section, or a file too large to fit in a context window. Open the per-site page for the exact criterion breakdown.

| # | Site | Domain | Score | Grade | Category | Size |
|---|------|--------|------:|:-----:|----------|-----:|
${notableFailures.map(row).join('\n')}

These aren't bad teams or bad products — \`llms.txt\` is new, and most teams haven't prioritised it yet. Submit a re-scored PR once your file ships the change and the next monthly crawl picks it up automatically.

### Lowest 10 (whole corpus, including long-tail unknowns)

| # | Site | Domain | Score | Grade | Size |
|---|------|--------|------:|:-----:|-----:|
${bottom10.map((e, i) => `| ${i + 1} | [${e.display_name}](${siteFolder(e.domain)}) | \`${e.domain}\` | ${e.score} | **${e.grade}** | ${(e.file_size_bytes / 1024).toFixed(1)} KB |`).join('\n')}

`;

const categoryOrder = ['ai-platform', 'data', 'auth', 'observability', 'infra', 'comms', 'docs-platform', 'billing', 'commerce', 'content', 'search', 'dev-tools'];
const categorySections = categoryOrder.map(categoryBlock).filter(Boolean).join('\n');

const tail = `## By category

The rubric is identical for every site. Categories exist so an agent builder looking for "every comms provider with a good \`llms.txt\`" gets one click. Top 15 per category shown.

${categorySections}

## Methodology in detail

For the short version, see [How scores are calculated](#how-scores-are-calculated) at the top of this page. For the longer version — every weight, every rationale, what we explicitly *don't* score — read [\`RUBRIC.md\`](./RUBRIC.md).

The rubric is refreshed monthly via [\`.github/workflows/crawl.yml\`](./.github/workflows/crawl.yml). Score drops auto-open an issue tagged \`regression\`; score rises auto-open a PR. Rubric weights themselves are revisited quarterly (Jan, Apr, Jul, Oct) so historic scores stay comparable across crawls.

## Score your own site

\`\`\`shell
npx llms-txt-score https://your-site.com/llms.txt
\`\`\`

\`\`\`shell
npx llms-txt-score https://your-site.com/llms.txt --format=markdown
\`\`\`

\`\`\`shell
npx llms-txt-score https://your-site.com/llms.txt > score.json
\`\`\`

Zero runtime dependencies. Node ≥ 18. Tool source: [\`tools/llms-txt-score/\`](./tools/llms-txt-score/).

## Embed the badge

Every scored site has its own SVG badge at \`web/badge/<domain>.svg\`. Drop this in your project README:

\`\`\`markdown
[![llms.txt score](https://raw.githubusercontent.com/agentrhq/awesome-llms-txt/main/docs/badge/your-site.com.svg)](https://github.com/agentrhq/awesome-llms-txt/tree/main/sites/your-site.com)
\`\`\`

The badge color tracks the grade (green for A, red for F). Re-scored monthly — your badge updates automatically.

## Contributing

PRs welcome. One PR per site. See [\`CONTRIBUTING.md\`](./CONTRIBUTING.md). Manual score edits are auto-rejected — CI re-runs the tool and compares.

Appeals (public): file an issue using the [appeal template](./.github/ISSUE_TEMPLATE/appeal.yml). Rubric proposals (reviewed quarterly): file an issue with the \`rubric\` label.

Maintainers: see [\`MAINTAINERS.md\`](./MAINTAINERS.md). Code of conduct: see [\`CODE_OF_CONDUCT.md\`](./CODE_OF_CONDUCT.md).

## What this is and isn't

- This is a **scored** leaderboard. It is not a pass / fail validator — try [llmstxtchecker.net](https://llmstxtchecker.net/) for that.
- This is not a directory. [\`directory.llmstxt.cloud\`](https://directory.llmstxt.cloud/) and [\`llms-txt-hub\`](https://github.com/thedaviddias/llms-txt-hub) do that.
- This is not an opinion on whether \`llms.txt\` should exist. We grade what's published.
- This is not endorsed by Answer.AI, Jeremy Howard, or any of the listed sites.

## Reference llms.txt

If you want a worked example of "what good looks like," open the top of the leaderboard. [Neon](./sites/neon.tech/) at **89 (A)** is the strongest real-world file in the corpus: H1 first line, blockquote summary, 19 H2 sections, 185 links (most are \`.md\` URL twins), dedicated auth signposting.

---

Data licensed [CC0-1.0](./LICENSE). Tool source [MIT](./tools/llms-txt-score/LICENSE).
`;

const out = intro + top25section + bottomSection + tail;
fs.writeFileSync(path.join(ROOT, 'README.md'), out);
console.error('wrote README.md (' + out.length + ' bytes)');
