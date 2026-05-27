#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { score, RUBRIC } = require('../tools/llms-txt-score/lib/score');
const { parse } = require('../tools/llms-txt-score/lib/parse');
const { categorize } = require('./categorize');
const { displayName } = require('./display-name');
const { badge } = require('./badge');

const ROOT = path.resolve(__dirname, '..');
const RESEARCH = path.join(ROOT, 'research');
const RAW_DIR = path.join(RESEARCH, 'raw');
const SITES_DIR = path.join(ROOT, 'sites');
const WEB_DIR = path.join(ROOT, 'docs');
const BADGE_DIR = path.join(WEB_DIR, 'badge');

const LABELS = {
  spec_compliance: 'Spec compliance',
  coverage: 'Coverage',
  agent_actions: 'Agent-action declarations',
  link_stability: 'Linked-content stability',
  freshness: 'Freshness',
  discoverability: 'Discoverability',
  auth_signposting: 'Auth signposting',
  size_discipline: 'Size discipline',
  content_type: 'Content-Type & encoding',
  voice: 'Voice',
};

function labelFor(id) { return LABELS[id] || id; }

function rubricMarkdown(components) {
  const rows = components.map(c => {
    const reasons = c.reasons && c.reasons.length ? ` _${c.reasons.join(', ')}_` : '';
    return `| ${labelFor(c.id)} | ${c.points}/${c.max} |${reasons} |`;
  }).join('\n');
  return `| Criterion | Score | Notes |\n|---|---:|---|\n${rows}`;
}

function siteReadme({ domain, display_name, category, result, fetched, freshness }) {
  const verifiedUrl = fetched.final_url || fetched.fetched_url || `https://${domain}/llms.txt`;
  const exceptional = [];
  const weak = [];
  for (const c of result.components) {
    const pct = c.points / c.max;
    if (pct >= 0.95) exceptional.push(`${labelFor(c.id)} (${c.points}/${c.max})`);
    if (pct <= 0.4)  weak.push(`${labelFor(c.id)} (${c.points}/${c.max})${c.reasons && c.reasons.length ? ': ' + c.reasons.slice(0, 3).join(', ') : ''}`);
  }
  const badgeURL = `../../docs/badge/${domain}.svg`;
  const embedURL = `https://raw.githubusercontent.com/agentrhq/awesome-llms-txt/main/docs/badge/${domain}.svg`;
  const fresh = freshness && freshness.last_modified
    ? `${freshness.age_days} day${freshness.age_days === 1 ? '' : 's'} (per \`Last-Modified\`)`
    : `unknown (no \`Last-Modified\` header)`;
  return `---
domain: ${domain}
display_name: ${display_name}
category: ${category}
score: ${result.score}
grade: ${result.grade}
last_scored: ${(fetched.fetched_at || new Date().toISOString()).slice(0, 10)}
verified_url: ${verifiedUrl}
file_size_bytes: ${result.parsed.raw_bytes}
link_count: ${result.parsed.link_count}
value_link_count: ${result.parsed.value_link_count}
section_count: ${result.parsed.section_count}
freshness_age_days: ${freshness && freshness.age_days != null ? freshness.age_days : 'null'}
---

# ${display_name}

![Score ${result.score}/${100} · Grade ${result.grade}](${badgeURL})

Category: **${category}** · [Live llms.txt](${verifiedUrl}) · Snapshot: [\`llms.txt\`](./llms.txt) · Machine-readable: [\`score.json\`](./score.json)

${result.parsed.h1 ? `**H1:** ${result.parsed.h1}` : '**H1:** _missing_'}
${result.parsed.blockquote ? `\n> ${result.parsed.blockquote.slice(0, 280)}${result.parsed.blockquote.length > 280 ? '…' : ''}` : ''}

**File facts:** ${(result.parsed.raw_bytes / 1024).toFixed(1)} KB · ${result.parsed.section_count} \`## sections\` · ${result.parsed.link_count} links (${result.parsed.value_link_count} after low-value discount) · Freshness: ${fresh}.

## Scorecard

${rubricMarkdown(result.components)}

${exceptional.length ? `## What's exceptional\n\n${exceptional.map(x => '- ' + x).join('\n')}\n` : ''}
${weak.length ? `## What's weak\n\n${weak.map(x => '- ' + x).join('\n')}\n` : ''}
## Embed the badge

\`\`\`markdown
[![llms.txt score ${result.score} (${result.grade})](${embedURL})](https://github.com/agentrhq/awesome-llms-txt/tree/main/sites/${domain})
\`\`\`

## Reproduce this score

\`\`\`bash
npx llms-txt-score ${verifiedUrl}
\`\`\`

See [the rubric](../../RUBRIC.md) for what each criterion checks.
`;
}

function safeWrite(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

function loadFreshness() {
  const fp = path.join(RESEARCH, 'freshness.json');
  if (!fs.existsSync(fp)) return {};
  return JSON.parse(fs.readFileSync(fp, 'utf8'));
}

function clean(domain) {
  // Filesystem-safe.
  return domain.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function main() {
  if (fs.existsSync(SITES_DIR)) {
    fs.rmSync(SITES_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(SITES_DIR, { recursive: true });
  fs.mkdirSync(BADGE_DIR, { recursive: true });

  const results = JSON.parse(fs.readFileSync(path.join(RESEARCH, 'results.json'), 'utf8'));
  const freshness = loadFreshness();

  const accepted = results.filter(r => r.accepted);
  console.error(`scoring ${accepted.length} accepted sites…`);

  // De-dupe by domain (keep the highest size_bytes, which is usually the most complete copy).
  const byDomain = new Map();
  for (const r of accepted) {
    const prior = byDomain.get(r.domain);
    if (!prior || (r.size_bytes || 0) > (prior.size_bytes || 0)) byDomain.set(r.domain, r);
  }
  console.error(`after de-dupe: ${byDomain.size} unique domains`);

  // Drop sites whose live URL now returns 4xx/5xx (per the most recent
  // freshness probe). We don't want the leaderboard linking to dead URLs.
  const droppedDead = [];
  for (const [d, r] of [...byDomain.entries()]) {
    const fr = freshness[d];
    if (fr && fr.head_status && (fr.head_status >= 400 && fr.head_status < 600)) {
      byDomain.delete(d);
      droppedDead.push({ domain: d, status: fr.head_status });
    }
  }
  if (droppedDead.length > 0) {
    console.error(`dropped ${droppedDead.length} sites whose live llms.txt now 4xx/5xx:`);
    for (const d of droppedDead) console.error(`  ${d.status}  ${d.domain}`);
  }

  const manifest = [];
  let written = 0;

  for (const row of byDomain.values()) {
    const rawPath = path.join(RAW_DIR, clean(row.domain) + '.txt');
    if (!fs.existsSync(rawPath)) continue;
    const text = fs.readFileSync(rawPath, 'utf8');
    const fr = freshness[row.domain];
    const opts = {
      http_status: row.http_status,
      content_type: row.content_type,
      fetched_url: row.fetched_url,
      final_url: row.final_url,
      last_modified: fr && fr.last_modified ? fr.last_modified : null,
    };
    const result = score(text, opts);
    const parsedRich = parse(text); // for categorization (section titles)
    const category = categorize(row.domain, parsedRich);
    const display_name = displayName(row.domain, parsedRich);

    const dirSafe = clean(row.domain);
    const dir = path.join(SITES_DIR, dirSafe);
    fs.mkdirSync(path.join(dir, 'history'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'llms.txt'), text);
    fs.writeFileSync(path.join(dir, 'history', `${(row.fetched_at || new Date().toISOString()).slice(0, 10)}.txt`), text);

    const scoreJson = {
      schema_version: 2,
      domain: row.domain,
      display_name,
      category,
      verified_url: row.final_url || row.fetched_url,
      fetched_at: row.fetched_at,
      http_status: row.http_status,
      content_type: row.content_type,
      file_size_bytes: row.size_bytes,
      last_modified: fr && fr.last_modified ? fr.last_modified : null,
      freshness_age_days: fr && fr.age_days != null ? fr.age_days : null,
      score: result.score,
      grade: result.grade,
      components: result.components,
      parsed: result.parsed,
      tool: { name: 'llms-txt-score', version: '0.2.0' },
    };
    fs.writeFileSync(path.join(dir, 'score.json'), JSON.stringify(scoreJson, null, 2));

    fs.writeFileSync(path.join(dir, 'README.md'), siteReadme({
      domain: row.domain,
      display_name,
      category,
      result,
      fetched: row,
      freshness: fr,
    }));

    // Per-site SVG badge.
    const svg = badge({ score: result.score, grade: result.grade });
    safeWrite(path.join(BADGE_DIR, row.domain + '.svg'), svg);

    manifest.push({
      domain: row.domain,
      display_name,
      category,
      score: result.score,
      grade: result.grade,
      file_size_bytes: row.size_bytes,
      link_count: result.parsed.link_count,
      value_link_count: result.parsed.value_link_count,
      section_count: result.parsed.section_count,
      freshness_age_days: fr && fr.age_days != null ? fr.age_days : null,
      verified_url: row.final_url || row.fetched_url,
      last_scored: (row.fetched_at || new Date().toISOString()).slice(0, 10),
    });
    written++;
  }

  manifest.sort((a, b) => b.score - a.score || a.display_name.localeCompare(b.display_name));
  fs.mkdirSync(WEB_DIR, { recursive: true });
  fs.writeFileSync(path.join(WEB_DIR, 'leaderboard.json'), JSON.stringify(manifest, null, 2));

  // Distribution stats for the README.
  const stats = {
    total: manifest.length,
    avg: Math.round(manifest.reduce((s, e) => s + e.score, 0) / manifest.length),
    median: manifest[Math.floor(manifest.length / 2)].score,
    dist: {},
    with_lm: manifest.filter(e => e.freshness_age_days != null).length,
  };
  for (const e of manifest) stats.dist[e.grade] = (stats.dist[e.grade] || 0) + 1;
  fs.writeFileSync(path.join(WEB_DIR, 'stats.json'), JSON.stringify(stats, null, 2));

  console.error(`scored ${written} sites.`);
  console.error('grade distribution:', JSON.stringify(stats.dist));
  console.error('top 10:');
  for (const e of manifest.slice(0, 10)) {
    console.error(`  ${String(e.score).padStart(3)} ${e.grade.padEnd(2)}  ${e.domain}`);
  }
  console.error('bottom 5:');
  for (const e of manifest.slice(-5)) {
    console.error(`  ${String(e.score).padStart(3)} ${e.grade.padEnd(2)}  ${e.domain}`);
  }
  const byCategory = {};
  for (const e of manifest) (byCategory[e.category] ||= []).push(e);
  console.error('by category:', JSON.stringify(Object.fromEntries(Object.entries(byCategory).map(([k, v]) => [k, v.length]))));
  console.error(`with Last-Modified: ${stats.with_lm}/${stats.total} (${Math.round(100 * stats.with_lm / stats.total)}%)`);
}

main();
