#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const RESULTS = path.join(ROOT, 'research', 'results.json');
const OUT = path.join(ROOT, 'research', 'freshness.json');

const CONCURRENCY = 30;
const TIMEOUT_MS = 15000;
const UA = 'llms-txt-score/0.2 (+https://github.com/agentrhq/awesome-llms-txt)';

function request(target, method, redirectsLeft = 3) {
  return new Promise((resolve) => {
    let u;
    try { u = new URL(target); } catch (e) { return resolve({ status: 0, error: 'bad_url' }); }
    const lib = u.protocol === 'http:' ? http : https;
    const req = lib.request(
      {
        method,
        hostname: u.hostname,
        port: u.port || (u.protocol === 'http:' ? 80 : 443),
        path: u.pathname + u.search,
        headers: { 'User-Agent': UA, 'Accept': 'text/markdown, text/plain, */*' },
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirectsLeft > 0) {
          try {
            const next = new URL(res.headers.location, u).toString();
            res.resume();
            resolve(request(next, method, redirectsLeft - 1).then(r => ({ ...r, final_url: r.final_url || next })));
            return;
          } catch (e) { /* fall through */ }
        }
        res.resume();
        resolve({
          status: res.statusCode,
          headers: res.headers,
          final_url: target,
        });
      },
    );
    req.setTimeout(TIMEOUT_MS, () => { req.destroy(new Error('timeout')); resolve({ status: 0, error: 'timeout' }); });
    req.on('error', (e) => resolve({ status: 0, error: e.message || String(e) }));
    req.end();
  });
}

async function probe(url) {
  // Try HEAD first; some servers reject HEAD and only respond to GET.
  let r = await request(url, 'HEAD');
  if (!r.status || r.status === 405 || r.status === 501 || r.status === 403) {
    const g = await request(url, 'GET');
    if (g.status) r = g;
  }
  return r;
}

async function main() {
  const results = JSON.parse(fs.readFileSync(RESULTS, 'utf8'));
  const queue = results
    .filter(row => row.accepted)
    .map(row => ({ domain: row.domain, url: row.final_url || row.fetched_url }));
  // De-dupe by url.
  const seen = new Set();
  const work = [];
  for (const q of queue) {
    if (!q.url || seen.has(q.url)) continue;
    seen.add(q.url);
    work.push(q);
  }
  console.error(`probing ${work.length} URLs with concurrency ${CONCURRENCY}`);

  const out = {};
  let done = 0;
  let inflight = 0;
  let idx = 0;

  await new Promise((resolveAll) => {
    function pump() {
      while (inflight < CONCURRENCY && idx < work.length) {
        const i = idx++;
        const { domain, url } = work[i];
        inflight++;
        probe(url).then((r) => {
          const headers = r.headers || {};
          const lastModified = headers['last-modified'] || null;
          let ageDays = null;
          if (lastModified) {
            const t = new Date(lastModified).getTime();
            if (Number.isFinite(t)) ageDays = Math.floor((Date.now() - t) / 86400000);
          }
          out[domain] = {
            domain,
            url,
            head_status: r.status || 0,
            head_final_url: r.final_url || url,
            last_modified: lastModified,
            content_type: headers['content-type'] || null,
            cache_control: headers['cache-control'] || null,
            etag: headers['etag'] || null,
            checked_at: new Date().toISOString(),
            age_days: ageDays,
            error: r.error || null,
          };
          done++;
          if (done % 50 === 0) console.error(`  ${done}/${work.length}`);
        }).finally(() => {
          inflight--;
          if (idx >= work.length && inflight === 0) {
            resolveAll();
          } else {
            pump();
          }
        });
      }
    }
    pump();
  });

  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  const withLM = Object.values(out).filter(x => x.last_modified).length;
  const ages = Object.values(out).filter(x => x.age_days !== null).map(x => x.age_days).sort((a, b) => a - b);
  const median = ages[Math.floor(ages.length / 2)];
  console.error(`done. ${Object.keys(out).length} probed, ${withLM} returned Last-Modified, median age = ${median} days`);
}

main().catch(e => { console.error('error:', e.message); process.exit(1); });
