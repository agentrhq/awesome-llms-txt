'use strict';

const https = require('https');
const http = require('http');
const { URL } = require('url');

function request(target, method, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    let u;
    try { u = new URL(target); } catch (e) { return reject(e); }
    const lib = u.protocol === 'http:' ? http : https;
    const req = lib.request(
      {
        method,
        hostname: u.hostname,
        port: u.port || (u.protocol === 'http:' ? 80 : 443),
        path: u.pathname + u.search,
        headers: {
          'User-Agent': 'llms-txt-score/0.1 (+https://github.com/agentrhq/awesome-llms-txt)',
          'Accept': 'text/markdown, text/plain, */*',
        },
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirectsLeft > 0) {
          const next = new URL(res.headers.location, u).toString();
          res.resume();
          resolve(request(next, method, redirectsLeft - 1).then(r => ({ ...r, redirected_from: target })));
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          resolve({
            url: target,
            final_url: target,
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks),
          });
        });
      },
    );
    req.setTimeout(15000, () => { req.destroy(new Error('timeout')); });
    req.on('error', reject);
    req.end();
  });
}

async function fetchText(url) {
  const r = await request(url, 'GET');
  return {
    status: r.status,
    content_type: r.headers['content-type'] || '',
    last_modified: r.headers['last-modified'] || null,
    final_url: r.final_url || url,
    body: r.body.toString('utf8'),
    bytes: r.body.length,
  };
}

async function head(url) {
  try {
    const r = await request(url, 'HEAD');
    return { status: r.status, content_type: r.headers['content-type'] || '' };
  } catch (e) {
    return { status: 0, error: e.message };
  }
}

async function checkLinkSample(urls, n = 8) {
  if (!urls || urls.length === 0) return { sampled: 0, ok: 0, results: [] };
  const pick = [];
  const step = Math.max(1, Math.floor(urls.length / n));
  for (let i = 0; i < urls.length && pick.length < n; i += step) pick.push(urls[i]);
  const results = await Promise.all(pick.map(async (u) => {
    const r = await head(u);
    const ok = r.status >= 200 && r.status < 400;
    return { url: u, status: r.status, ok };
  }));
  return { sampled: results.length, ok: results.filter(r => r.ok).length, results };
}

module.exports = { fetchText, head, checkLinkSample };
