#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'web', 'leaderboard.json'), 'utf8'));
const stats = JSON.parse(fs.readFileSync(path.join(ROOT, 'web', 'stats.json'), 'utf8'));

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
  const more = total > 15 ? `\n\n_See [\`leaderboard.json\`](./web/leaderboard.json) for the full ${total}._` : '';
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

[![Sites scored](https://img.shields.io/badge/sites_scored-${stats.total}-blue.svg)](./web/leaderboard.json)
[![Avg score](https://img.shields.io/badge/avg_score-${stats.avg}-yellow.svg)](./RUBRIC.md)
[![A grades](https://img.shields.io/badge/A_grades-${aGraded.length}-brightgreen.svg)](#top-25)
[![License: CC0-1.0](https://img.shields.io/badge/data-CC0--1.0-lightgrey.svg)](./LICENSE)

${hook}

## Contents

- [Top 25](#top-25)
- [Hall of shame](#hall-of-shame)
- [By category](#by-category)
- [Methodology](#methodology)
- [Score your own site](#score-your-own-site)
- [Embed the badge](#embed-the-badge)
- [Contributing](#contributing)
- [What this is and isn't](#what-this-is-and-isnt)

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

[Full table (${stats.total.toLocaleString()} rows) →](./web/leaderboard.json) · [Sortable web view →](https://agentrhq.github.io/awesome-llms-txt/) ${'<!-- pages -->'}

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

const bottomSection = `## Notable failures

Big-brand or large-corpus sites that earned a D or F. Most are five-minute fixes (no H1, no \`## Auth\` section, oversized file). Submit a re-scored PR once you ship the change.

| # | Site | Domain | Score | Grade | Category | Size |
|---|------|--------|------:|:-----:|----------|-----:|
${notableFailures.map(row).join('\n')}

## Lowest 10 (whole corpus)

| # | Site | Domain | Score | Grade | Size |
|---|------|--------|------:|:-----:|-----:|
${bottom10.map((e, i) => `| ${i + 1} | [${e.display_name}](${siteFolder(e.domain)}) | \`${e.domain}\` | ${e.score} | **${e.grade}** | ${(e.file_size_bytes / 1024).toFixed(1)} KB |`).join('\n')}

`;

const categoryOrder = ['ai-platform', 'data', 'auth', 'observability', 'infra', 'comms', 'docs-platform', 'billing', 'commerce', 'content', 'search', 'dev-tools'];
const categorySections = categoryOrder.map(categoryBlock).filter(Boolean).join('\n');

const tail = `## By category

The rubric is identical for every site. Categories exist so an agent builder looking for "every comms provider with a good \`llms.txt\`" gets one click. Top 15 per category shown.

${categorySections}

## Methodology

10 weighted criteria, 100-point total. Full breakdown in [\`RUBRIC.md\`](./RUBRIC.md). Refreshed monthly via [\`.github/workflows/crawl.yml\`](./.github/workflows/crawl.yml). Score drops auto-open an issue tagged \`regression\`; score rises auto-open a PR.

| Weight | Criterion | What we check |
|------:|---|---|
| 20 | Coverage | Section count, value-weighted link count (blog / case-study / press URLs discounted), canonical-section diversity |
| 18 | Spec compliance | H1 first line, single H1, blockquote, well-formed \`[name](url): note\` lists, H3 subsections honored |
| 14 | Agent-action declarations | \`llms-full.txt\` companion, \`.md\` URL twins, MCP, \`/.well-known/\`, OpenAPI |
| 10 | Linked-content stability | Sampled HEAD checks on 8 random links (CI re-runs live) |
| 10 | Freshness | \`Last-Modified\` age, 10 at ≤7 days down to 1 at >365 days |
|  8 | Discoverability | HTTP 200 at \`/llms.txt\`, no redirect chain |
|  8 | Auth signposting | Auth keywords + \`## Auth\` / \`### Authentication\` / \`## Credentials\` / \`## Access\` section |
|  6 | Size discipline | Context-window friendliness — under 32 KB ideal, 0 over 512 KB |
|  4 | Content-Type & encoding | \`text/markdown; charset=utf-8\` or \`text/plain; charset=utf-8\`; mojibake docks a point |
|  2 | Voice | Plain declarative language; intro em-dashes and marketing phrases penalised |

Grade bands (Mozilla HTTP Observatory style, capped at 100): **A+** ≥ 95, **A** ≥ 85, **A-** ≥ 80, **B+** ≥ 75, **B** ≥ 65, **C** ≥ 50, **D** ≥ 35, **F** < 35. \`A\` at 85 matches Lighthouse's "green" threshold so screenshots are instantly legible.

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
[![llms.txt score](https://raw.githubusercontent.com/agentrhq/awesome-llms-txt/main/web/badge/your-site.com.svg)](https://github.com/agentrhq/awesome-llms-txt/tree/main/sites/your-site.com)
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

## Why this exists

\`llms.txt\` is how a site tells an agent what it can do. [Authsome](https://authsome.dev/) is how an agent tells the site who it is. Both work better when the published affordances are clear, current, and machine-readable. Our own \`llms.txt\` ships at [\`exhibit-a/\`](./exhibit-a/) as a reference.

---

Curated by [Authsome](https://authsome.dev/) · agent identity for third-party APIs. Built by [Agentr](https://agentr.dev/).

Data licensed [CC0-1.0](./LICENSE). Tool source [MIT](./tools/llms-txt-score/LICENSE).
`;

const out = intro + top25section + bottomSection + tail;
fs.writeFileSync(path.join(ROOT, 'README.md'), out);
console.error('wrote README.md (' + out.length + ' bytes)');
