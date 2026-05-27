#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { score, RUBRIC } = require('../lib/score');
const { fetchText, checkLinkSample } = require('../lib/fetch');

const HELP = `llms-txt-score — score an llms.txt file against the public rubric.

Usage:
  llms-txt-score <url-or-file> [options]

Examples:
  llms-txt-score https://stripe.com/llms.txt
  llms-txt-score ./llms.txt --format=markdown
  npx llms-txt-score https://resend.com/llms.txt --check-links

Options:
  --format=json|markdown   output format (default: json)
  --out=<path>             write to a file
  --check-links            sample 8 links and check HTTP status (default off for speed)
  --content-type=<ct>      override content-type for local-file scoring
  --no-color               disable ANSI color in markdown output
  -h, --help               show this help

The rubric (100 points):
${RUBRIC.map(r => `  ${String(r.max).padStart(3)} pts  ${r.label}`).join('\n')}

Grade thresholds: A+ 95+, A 85, A- 80, B+ 75, B 65, C 50, D 35, F < 35.

Full methodology: https://github.com/agentrhq/awesome-llms-txt/blob/main/RUBRIC.md
`;

function parseArgs(argv) {
  const opts = { format: 'json', target: null, checkLinks: false, contentType: null, out: null, color: true, lastModified: null, fetchedUrl: null, finalUrl: null };
  for (const a of argv) {
    if (a === '-h' || a === '--help') opts.help = true;
    else if (a === '--check-links') opts.checkLinks = true;
    else if (a === '--no-color') opts.color = false;
    else if (a.startsWith('--format=')) opts.format = a.slice(9);
    else if (a.startsWith('--out=')) opts.out = a.slice(6);
    else if (a.startsWith('--content-type=')) opts.contentType = a.slice('--content-type='.length);
    else if (a.startsWith('--last-modified=')) opts.lastModified = a.slice('--last-modified='.length);
    else if (a.startsWith('--fetched-url=')) opts.fetchedUrl = a.slice('--fetched-url='.length);
    else if (a.startsWith('--final-url=')) opts.finalUrl = a.slice('--final-url='.length);
    else if (!opts.target) opts.target = a;
  }
  return opts;
}

function color(code, str, enabled) {
  if (!enabled) return str;
  return `\x1b[${code}m${str}\x1b[0m`;
}

function gradeColor(g) {
  if (g.startsWith('A')) return 32;
  if (g.startsWith('B')) return 92;
  if (g === 'C') return 33;
  if (g === 'D') return 31;
  return 91;
}

function renderMarkdown(result, target, enableColor) {
  const lines = [];
  const gc = gradeColor(result.grade);
  const headline = `Score: ${result.score}/100   Grade: ${result.grade}`;
  lines.push(color(gc, headline, enableColor));
  lines.push('-'.repeat(headline.length));
  lines.push(`Target: ${target}`);
  if (result.parsed.h1) lines.push(`H1: ${result.parsed.h1}`);
  if (result.parsed.blockquote) lines.push(`Summary: ${result.parsed.blockquote.slice(0, 120)}${result.parsed.blockquote.length > 120 ? '…' : ''}`);
  lines.push(`Sections: ${result.parsed.section_count}   Links: ${result.parsed.link_count}   Size: ${(result.parsed.raw_bytes/1024).toFixed(1)} KB`);
  lines.push('');
  lines.push('Rubric breakdown:');
  for (const c of result.components) {
    const def = RUBRIC.find(r => r.id === c.id);
    const bar = renderBar(c.points, c.max);
    lines.push(`  ${bar}  ${String(c.points).padStart(2)}/${String(c.max).padStart(2)}  ${def.label}`);
    if (c.reasons && c.reasons.length) lines.push(`        notes: ${c.reasons.join(', ')}`);
  }
  return lines.join('\n');
}

function renderBar(points, max) {
  const width = 10;
  const filled = Math.round((points / max) * width);
  return '[' + '#'.repeat(filled) + '-'.repeat(width - filled) + ']';
}

async function main() {
  const args = process.argv.slice(2);
  const opts = parseArgs(args);
  if (opts.help || !opts.target) {
    process.stdout.write(HELP);
    process.exit(opts.help ? 0 : 1);
  }

  let text, fetchedMeta = {};
  if (/^https?:\/\//.test(opts.target)) {
    try {
      const r = await fetchText(opts.target);
      text = r.body;
      fetchedMeta = {
        http_status: r.status,
        content_type: opts.contentType || r.content_type,
        last_modified: opts.lastModified || r.last_modified,
        fetched_url: opts.fetchedUrl || opts.target,
        final_url: opts.finalUrl || r.final_url,
      };
      if (r.status !== 200) {
        process.stderr.write(`warning: HTTP ${r.status} from ${opts.target}\n`);
      }
    } catch (e) {
      process.stderr.write(`fetch failed: ${e.message}\n`);
      process.exit(2);
    }
  } else {
    const abs = path.resolve(opts.target);
    text = fs.readFileSync(abs, 'utf8');
    fetchedMeta = {
      http_status: 200,
      content_type: opts.contentType || 'text/plain; charset=utf-8',
      last_modified: opts.lastModified || null,
      fetched_url: opts.fetchedUrl || 'file://' + abs,
      final_url: opts.finalUrl || opts.fetchedUrl || 'file://' + abs,
    };
  }

  let linkCheck = null;
  if (opts.checkLinks) {
    const { parse } = require('../lib/parse');
    const p = parse(text);
    const urls = p.sections.flatMap(s => s.items).filter(x => x.valid).map(x => x.url);
    linkCheck = await checkLinkSample(urls, 8);
  }

  const result = score(text, { ...fetchedMeta, link_check: linkCheck });
  result.target = opts.target;
  result.fetched = fetchedMeta;
  if (linkCheck) result.link_check = linkCheck;

  let output;
  if (opts.format === 'markdown') {
    output = renderMarkdown(result, opts.target, opts.color && !opts.out);
  } else {
    output = JSON.stringify(result, null, 2);
  }
  if (opts.out) fs.writeFileSync(opts.out, output);
  else process.stdout.write(output + '\n');
}

main().catch((e) => { process.stderr.write('error: ' + e.message + '\n'); process.exit(2); });
