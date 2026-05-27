#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const ROOT = path.resolve(__dirname, '..');

// 1. Internal link targets in the visible markdown surface (README, RUBRIC,
//    CONTRIBUTING, MAINTAINERS, CoC). Per-site readmes already point to known
//    paths, so we don't crawl all 1,023.
const SURFACE_FILES = ['README.md', 'RUBRIC.md', 'CONTRIBUTING.md', 'MAINTAINERS.md', 'CODE_OF_CONDUCT.md'];

const LINK_RE = /\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

function stripCodeBlocks(text) {
  // Remove fenced and inline code so example-text inside fences isn't checked.
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`\n]*`/g, '');
}

function listLinks(files) {
  const links = [];
  for (const f of files) {
    const abs = path.join(ROOT, f);
    if (!fs.existsSync(abs)) continue;
    const txt = stripCodeBlocks(fs.readFileSync(abs, 'utf8'));
    let m;
    while ((m = LINK_RE.exec(txt))) {
      links.push({ source: f, text: m[1], url: m[2] });
    }
  }
  return links;
}

function classify(url) {
  if (/^https?:\/\//i.test(url)) return 'http';
  if (url.startsWith('mailto:')) return 'mailto';
  if (url.startsWith('#')) return 'anchor-same';
  if (/#/.test(url)) return 'anchor-other';
  return 'path';
}

function relExists(url) {
  // Strip query, fragment, leading ./
  const clean = url.replace(/[?#].*$/, '').replace(/^\.\//, '');
  const abs = path.join(ROOT, clean);
  return fs.existsSync(abs);
}

function probeHttp(url, redirectsLeft = 3) {
  return new Promise((resolve) => {
    let u;
    try { u = new URL(url); } catch (e) { return resolve({ status: 0, error: 'bad_url' }); }
    const lib = u.protocol === 'http:' ? http : https;
    const req = lib.request({
      method: 'HEAD',
      hostname: u.hostname,
      port: u.port || (u.protocol === 'http:' ? 80 : 443),
      path: u.pathname + u.search,
      headers: { 'User-Agent': 'awesome-llms-txt-link-check/0.1', 'Accept': '*/*' },
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirectsLeft > 0) {
        try {
          const next = new URL(res.headers.location, u).toString();
          res.resume();
          return resolve(probeHttp(next, redirectsLeft - 1));
        } catch (e) { /* fall through */ }
      }
      res.resume();
      // Some servers reject HEAD; treat 405/501 specially.
      if (res.statusCode === 405 || res.statusCode === 501) {
        return resolve(probeHttp(url, 0)); // not very useful, but we mark inconclusive
      }
      resolve({ status: res.statusCode });
    });
    req.setTimeout(12000, () => { req.destroy(); resolve({ status: 0, error: 'timeout' }); });
    req.on('error', (e) => resolve({ status: 0, error: e.message || String(e) }));
    req.end();
  });
}

async function probeWithGet(url) {
  return new Promise((resolve) => {
    let u;
    try { u = new URL(url); } catch (e) { return resolve({ status: 0, error: 'bad_url' }); }
    const lib = u.protocol === 'http:' ? http : https;
    const req = lib.request({
      method: 'GET',
      hostname: u.hostname,
      port: u.port || (u.protocol === 'http:' ? 80 : 443),
      path: u.pathname + u.search,
      headers: { 'User-Agent': 'awesome-llms-txt-link-check/0.1', 'Range': 'bytes=0-0' },
    }, (res) => {
      res.resume();
      resolve({ status: res.statusCode });
    });
    req.setTimeout(12000, () => { req.destroy(); resolve({ status: 0, error: 'timeout' }); });
    req.on('error', (e) => resolve({ status: 0, error: e.message }));
    req.end();
  });
}

async function probe(url) {
  const r = await probeHttp(url);
  if (!r.status || r.status === 405 || r.status === 501 || r.status === 403 || r.status === 999) {
    return await probeWithGet(url);
  }
  return r;
}

(async () => {
  const links = listLinks(SURFACE_FILES);
  // De-dupe by URL.
  const seen = new Map();
  for (const l of links) {
    if (!seen.has(l.url)) seen.set(l.url, l);
  }
  const unique = [...seen.values()];
  console.error(`scanning ${unique.length} unique links across ${SURFACE_FILES.length} surface files`);

  const broken = { path: [], http: [], anchor: [] };

  // 1) Internal paths.
  for (const l of unique) {
    const kind = classify(l.url);
    if (kind === 'path' || kind === 'anchor-other') {
      const target = l.url.replace(/#.*$/, '');
      if (target && !relExists(target)) broken.path.push(l);
    }
  }

  // 2) HTTP probes (parallel, concurrency 12).
  const httpLinks = unique.filter(l => classify(l.url) === 'http');
  console.error(`HTTP-probing ${httpLinks.length} external links`);
  let idx = 0, inflight = 0, done = 0;
  await new Promise((resolveAll) => {
    function pump() {
      while (inflight < 12 && idx < httpLinks.length) {
        const l = httpLinks[idx++];
        inflight++;
        probe(l.url).then((r) => {
          const ok = r.status >= 200 && r.status < 400;
          if (!ok) broken.http.push({ ...l, ...r });
          done++;
          if (done % 25 === 0) console.error(`  ${done}/${httpLinks.length}`);
        }).finally(() => {
          inflight--;
          if (idx >= httpLinks.length && inflight === 0) resolveAll();
          else pump();
        });
      }
    }
    pump();
  });

  // 3) Same-page anchors. Verify against rendered headings.
  function slugify(s) {
    return s.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  function collectHeadings(file) {
    const txt = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const out = new Set();
    let m;
    const RE = /^#{1,6}\s+(.+?)\s*$/gm;
    while ((m = RE.exec(txt))) out.add(slugify(m[1]));
    return out;
  }
  for (const file of SURFACE_FILES) {
    if (!fs.existsSync(path.join(ROOT, file))) continue;
    const headings = collectHeadings(file);
    const fileLinks = links.filter(l => l.source === file && classify(l.url) === 'anchor-same');
    for (const l of fileLinks) {
      const anchor = l.url.slice(1);
      if (anchor && !headings.has(anchor)) broken.anchor.push(l);
    }
  }

  // Report.
  console.error('');
  console.error('=== BROKEN PATHS ===');
  for (const l of broken.path) console.error(`  ${l.source}: [${l.text}](${l.url})`);
  console.error('');
  console.error('=== BROKEN HTTP (non-2xx/3xx) ===');
  for (const l of broken.http) console.error(`  ${l.source} → ${l.status || l.error}: [${l.text}](${l.url})`);
  console.error('');
  console.error('=== BROKEN ANCHORS ===');
  for (const l of broken.anchor) console.error(`  ${l.source}: [${l.text}](${l.url})`);
  console.error('');
  console.error(`totals: paths=${broken.path.length} http=${broken.http.length} anchors=${broken.anchor.length}`);

  // Bonus: corpus-wide 404 check using freshness.json (we already HEAD-fetched
  // every verified_url for freshness).
  console.error('');
  console.error('=== verified_url status from freshness.json ===');
  const freshness = JSON.parse(fs.readFileSync(path.join(ROOT, 'research/freshness.json'), 'utf8'));
  const buckets = {};
  for (const r of Object.values(freshness)) {
    const b = r.head_status || 'err';
    buckets[b] = (buckets[b] || 0) + 1;
  }
  console.error(JSON.stringify(buckets, null, 2));
  const dead = Object.values(freshness).filter(r => r.head_status && r.head_status >= 400);
  console.error(`sites whose live llms.txt now returns 4xx/5xx: ${dead.length}`);
  if (dead.length > 0) {
    console.error('sample of dead live URLs:');
    for (const r of dead.slice(0, 15)) console.error(`  ${r.head_status}  ${r.domain}  ${r.url}`);
  }
})();
