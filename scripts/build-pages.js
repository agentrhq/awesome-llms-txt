#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WEB = path.join(ROOT, 'web');
const SITE_PAGES = path.join(WEB, 'site');
const OG = path.join(WEB, 'og');

const manifest = JSON.parse(fs.readFileSync(path.join(WEB, 'leaderboard.json'), 'utf8'));
const stats = JSON.parse(fs.readFileSync(path.join(WEB, 'stats.json'), 'utf8'));

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

const GRADE_COLORS = {
  'A+': '#22c55e', 'A': '#22c55e', 'A-': '#4ade80',
  'B+': '#84cc16', 'B': '#a3e635', 'C': '#eab308',
  'D': '#f97316', 'F': '#ef4444',
};

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function shell({ title, description, body, ogImage, depth = 1 }) {
  const cssPath = depth === 0 ? './style.css' : '../style.css';
  const homePath = depth === 0 ? './' : '../';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:type" content="website" />
  ${ogImage ? `<meta property="og:image" content="${esc(ogImage)}" />` : ''}
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="stylesheet" href="${cssPath}" />
</head>
<body>
${body}
<footer>
  <p>${depth === 0 ? '' : `<a href="${homePath}">Leaderboard</a> · `}<a href="https://github.com/agentrhq/awesome-llms-txt">GitHub</a> · <a href="https://github.com/agentrhq/awesome-llms-txt/blob/main/RUBRIC.md">Rubric</a> · <a href="https://github.com/agentrhq/awesome-llms-txt/blob/main/CONTRIBUTING.md">Contributing</a></p>
</footer>
</body>
</html>
`;
}

function sitePageBody(entry, scoreJson) {
  const color = GRADE_COLORS[entry.grade] || '#888';
  const folder = entry.domain.replace(/[^a-zA-Z0-9._-]/g, '_');
  const ageLine = scoreJson.last_modified
    ? `<span class="meta">Last-Modified: <strong>${esc(new Date(scoreJson.last_modified).toUTCString())}</strong> (${scoreJson.freshness_age_days}d)</span>`
    : `<span class="meta">Last-Modified: <em>not provided</em></span>`;

  const components = scoreJson.components.map(c => {
    const pct = Math.round((c.points / c.max) * 100);
    const reasons = c.reasons && c.reasons.length ? `<div class="reasons">${esc(c.reasons.join(' · '))}</div>` : '';
    return `<tr>
      <td>${esc(LABELS[c.id] || c.id)}</td>
      <td class="num"><strong>${c.points}</strong>/${c.max}</td>
      <td class="bar"><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div></td>
      <td class="reasons-cell">${reasons}</td>
    </tr>`;
  }).join('');

  return `
<header class="site-header">
  <p><a href="../">← Leaderboard</a></p>
  <h1>${esc(entry.display_name)} <span class="domain">${esc(entry.domain)}</span></h1>
  <div class="hero-card">
    <div class="big-score" style="color:${color}">${entry.score}<span class="score-out">/100</span></div>
    <div class="big-grade" style="background:${color}">${esc(entry.grade)}</div>
    <div class="hero-meta">
      <span class="meta">Category: <strong>${esc(entry.category)}</strong></span>
      <span class="meta">${(entry.file_size_bytes / 1024).toFixed(1)} KB · ${entry.section_count} sections · ${entry.link_count} links (${entry.value_link_count} after low-value discount)</span>
      ${ageLine}
    </div>
  </div>
  <div class="links">
    <a class="btn" href="${esc(entry.verified_url)}">Live llms.txt ↗</a>
    <a class="btn" href="https://github.com/agentrhq/awesome-llms-txt/tree/main/sites/${folder}">View on GitHub ↗</a>
    <a class="btn" href="../badge/${esc(entry.domain)}.svg">Badge SVG ↗</a>
  </div>
</header>

<main>
  <section>
    <h2>Scorecard</h2>
    <table class="scorecard">
      <thead><tr><th>Criterion</th><th class="num">Score</th><th>Bar</th><th>Notes</th></tr></thead>
      <tbody>${components}</tbody>
    </table>
  </section>

  <section>
    <h2>Embed the badge</h2>
    <p>Paste this in your project README. The badge updates when we re-score monthly.</p>
    <pre><code>[![llms.txt score ${entry.score} (${esc(entry.grade)})](https://raw.githubusercontent.com/agentrhq/awesome-llms-txt/main/web/badge/${esc(entry.domain)}.svg)](https://agentrhq.github.io/awesome-llms-txt/site/${esc(entry.domain)}.html)</code></pre>
    <p>Renders as: <img src="../badge/${esc(entry.domain)}.svg" alt="llms.txt badge" /></p>
  </section>

  <section>
    <h2>Reproduce this score</h2>
    <pre><code>npx llms-txt-score ${esc(entry.verified_url)}</code></pre>
    <p>Zero runtime dependencies. <a href="https://github.com/agentrhq/awesome-llms-txt/blob/main/RUBRIC.md">Full methodology in RUBRIC.md.</a></p>
  </section>
</main>
`;
}

function indexPageBody() {
  const top10 = manifest.slice(0, 10);
  const stripeRow = manifest.find(e => e.domain === 'docs.stripe.com') || {};
  const vercelRow = manifest.find(e => e.domain === 'vercel.com') || {};
  const neonRow = manifest[0];
  const aGraded = manifest.filter(e => e.grade.startsWith('A')).length;

  return `
<header class="home-header">
  <h1>Awesome <code>llms.txt</code></h1>
  <p class="tagline">The scored leaderboard. Like Lighthouse, but for the file that tells agents what your site can do.</p>

  <div class="stats">
    <div class="stat"><div class="stat-num">${stats.total.toLocaleString()}</div><div class="stat-lbl">sites scored</div></div>
    <div class="stat"><div class="stat-num">${stats.avg}</div><div class="stat-lbl">avg score</div></div>
    <div class="stat"><div class="stat-num">${aGraded}</div><div class="stat-lbl">A grades</div></div>
    <div class="stat"><div class="stat-num">${stats.dist.F || 0}</div><div class="stat-lbl">F grades</div></div>
  </div>

  <div class="callout">
    <p><strong>Stripe scored ${stripeRow.score}. Vercel scored ${vercelRow.score}. ${aGraded} sites earned an A.</strong> Top of the leaderboard: <a href="./site/${esc(neonRow.domain)}.html">${esc(neonRow.display_name)}</a> at <strong>${neonRow.score}</strong>.</p>
  </div>

  <div class="scan-bar">
    <code>npx llms-txt-score https://your-site.com/llms.txt</code>
  </div>
</header>

<main>
  <div class="top10">
    <h2>Top 10</h2>
    <ol class="top10-list">
      ${top10.map(e => `<li><a href="./site/${esc(e.domain)}.html"><span class="t10-name">${esc(e.display_name)}</span><span class="t10-domain">${esc(e.domain)}</span><span class="t10-grade" style="background:${GRADE_COLORS[e.grade]}">${esc(e.grade)}</span><span class="t10-score">${e.score}</span></a></li>`).join('')}
    </ol>
  </div>

  <div class="filters">
    <h2>Full leaderboard</h2>
    <div class="controls">
      <input id="q" type="search" placeholder="domain or name…" />
      <select id="cat"><option value="">All categories</option></select>
      <select id="grade">
        <option value="">All grades</option>
        <option>A+</option><option>A</option><option>A-</option>
        <option>B+</option><option>B</option>
        <option>C</option><option>D</option><option>F</option>
      </select>
      <span id="count" class="count"></span>
    </div>
    <table id="board">
      <thead>
        <tr>
          <th data-key="rank" class="num">#</th>
          <th data-key="display_name">Site</th>
          <th data-key="domain">Domain</th>
          <th data-key="score" class="num">Score</th>
          <th data-key="grade">Grade</th>
          <th data-key="category">Category</th>
          <th data-key="freshness_age_days" class="num">Age</th>
          <th data-key="file_size_bytes" class="num">Size</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  </div>
</main>

<script src="./app.js"></script>
`;
}

function appJs() {
  return `
const GRADE_COLORS = ${JSON.stringify(GRADE_COLORS)};
let state = { sort: 'score', dir: 'desc', q: '', cat: '', grade: '' };
let data = [];

const esc = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtKB = (b) => (b / 1024).toFixed(1) + ' KB';
const fmtAge = (d) => d == null ? '—' : d === 0 ? 'today' : d + 'd';

async function load() {
  const res = await fetch('./leaderboard.json');
  data = await res.json();
  const cats = [...new Set(data.map(e => e.category))].sort();
  const catSel = document.getElementById('cat');
  for (const c of cats) {
    const o = document.createElement('option'); o.value = c; o.textContent = c; catSel.appendChild(o);
  }
  render();
}

function render() {
  let rows = data.filter(e => {
    if (state.q && !(e.display_name.toLowerCase().includes(state.q.toLowerCase()) || e.domain.toLowerCase().includes(state.q.toLowerCase()))) return false;
    if (state.cat && e.category !== state.cat) return false;
    if (state.grade && e.grade !== state.grade) return false;
    return true;
  });
  rows.sort((a, b) => {
    const k = state.sort;
    let av = a[k], bv = b[k];
    if (av == null) av = state.dir === 'asc' ? Infinity : -Infinity;
    if (bv == null) bv = state.dir === 'asc' ? Infinity : -Infinity;
    if (typeof av === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase(); }
    if (av < bv) return state.dir === 'asc' ? -1 : 1;
    if (av > bv) return state.dir === 'asc' ? 1 : -1;
    return 0;
  });
  document.querySelector('#board tbody').innerHTML = rows.map((e, i) => \`
    <tr>
      <td class="num">\${i + 1}</td>
      <td><a href="./site/\${esc(e.domain)}.html">\${esc(e.display_name)}</a></td>
      <td class="domain">\${esc(e.domain)}</td>
      <td class="num"><strong>\${e.score}</strong></td>
      <td><span class="grade-pill" style="background:\${GRADE_COLORS[e.grade]}">\${esc(e.grade)}</span></td>
      <td><span class="cat">\${esc(e.category)}</span></td>
      <td class="num">\${fmtAge(e.freshness_age_days)}</td>
      <td class="num">\${fmtKB(e.file_size_bytes)}</td>
    </tr>\`).join('');
  document.getElementById('count').textContent = rows.length + ' / ' + data.length;
  for (const th of document.querySelectorAll('th[data-key]')) {
    th.classList.toggle('sorted', th.dataset.key === state.sort);
    th.classList.toggle('asc', state.dir === 'asc');
  }
}

document.querySelector('#q').addEventListener('input', (e) => { state.q = e.target.value; render(); });
document.querySelector('#cat').addEventListener('change', (e) => { state.cat = e.target.value; render(); });
document.querySelector('#grade').addEventListener('change', (e) => { state.grade = e.target.value; render(); });
for (const th of document.querySelectorAll('th[data-key]')) {
  th.addEventListener('click', () => {
    const k = th.dataset.key;
    if (state.sort === k) state.dir = state.dir === 'asc' ? 'desc' : 'asc';
    else { state.sort = k; state.dir = ['display_name','domain','category','grade'].includes(k) ? 'asc' : 'desc'; }
    render();
  });
}
load();
`;
}

function styleCss() {
  return `:root {
  --bg: #0a0a0a; --surface: #121212; --border: #222; --text: #e7e7e7;
  --muted: #a3a3a3; --faint: #6b6b6b; --accent: #83CA16;
}
* { box-sizing: border-box; }
html, body { background: var(--bg); color: var(--text); margin: 0; font: 15px/1.5 'Geist', system-ui, -apple-system, sans-serif; }
code, pre { font-family: 'Geist Mono', ui-monospace, monospace; }
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
.home-header, main, .site-header, footer { max-width: 1100px; margin: 0 auto; padding: 24px; }
.home-header { padding-top: 48px; }
h1 { font-size: clamp(28px, 4vw, 44px); letter-spacing: -0.02em; margin: 0 0 12px; }
h1 code { color: var(--accent); background: none; padding: 0; }
.tagline { font-size: 18px; color: var(--muted); max-width: 720px; margin: 0 0 32px; }
.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 0 0 24px; }
.stat { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 16px; }
.stat-num { font-size: 28px; font-weight: 600; }
.stat-lbl { font-size: 11px; color: var(--faint); text-transform: uppercase; letter-spacing: 0.06em; margin-top: 4px; }
.callout { background: var(--surface); border-left: 3px solid var(--accent); padding: 16px 20px; margin: 0 0 24px; border-radius: 0 8px 8px 0; }
.callout p { margin: 0; font-size: 16px; }
.scan-bar { background: #000; border: 1px solid var(--border); border-radius: 6px; padding: 14px 18px; font-family: 'Geist Mono', monospace; color: var(--accent); overflow-x: auto; }
.top10 { margin: 48px 0 32px; }
.top10 h2, .filters h2 { font-size: 18px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 500; margin-bottom: 12px; }
.top10-list { list-style: none; padding: 0; margin: 0; counter-reset: rank; }
.top10-list li { counter-increment: rank; }
.top10-list a { display: grid; grid-template-columns: 32px 1fr 1fr 50px 60px; gap: 12px; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--border); color: var(--text); }
.top10-list a::before { content: counter(rank); color: var(--faint); font-variant-numeric: tabular-nums; }
.top10-list a:hover { background: rgba(255,255,255,0.02); text-decoration: none; }
.t10-name { font-weight: 500; }
.t10-domain { color: var(--muted); font-family: 'Geist Mono', monospace; font-size: 12px; }
.t10-grade { font-family: 'Geist Mono', monospace; font-weight: 600; font-size: 12px; text-align: center; padding: 4px 8px; border-radius: 4px; color: #000; }
.t10-score { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }
.controls { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-bottom: 16px; }
.controls input, .controls select { background: var(--surface); color: var(--text); border: 1px solid var(--border); padding: 8px 12px; border-radius: 6px; font-family: inherit; font-size: 14px; }
.count { margin-left: auto; color: var(--faint); font-size: 12px; }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
th { text-align: left; padding: 10px 8px; border-bottom: 1px solid var(--border); color: var(--muted); font-weight: 500; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; user-select: none; }
th[data-key].sorted::after { content: ' ▼'; font-size: 9px; color: var(--accent); }
th[data-key].sorted.asc::after { content: ' ▲'; }
td { padding: 10px 8px; border-bottom: 1px solid var(--border); vertical-align: middle; }
tr:hover td { background: rgba(255,255,255,0.02); }
.num { text-align: right; font-variant-numeric: tabular-nums; color: var(--muted); }
.grade-pill { display: inline-block; min-width: 32px; text-align: center; padding: 3px 8px; border-radius: 4px; font-weight: 600; font-size: 11px; font-family: 'Geist Mono', monospace; color: #000; }
.cat { display: inline-block; padding: 2px 8px; border-radius: 4px; background: rgba(131,202,22,0.08); color: var(--accent); font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
.domain { font-family: 'Geist Mono', monospace; font-size: 12px; color: var(--muted); }
footer { margin-top: 64px; padding: 32px 24px; border-top: 1px solid var(--border); color: var(--muted); font-size: 13px; }
footer p { margin: 4px 0; }

/* site detail page */
.site-header h1 { margin-top: 8px; }
.site-header .domain { font-family: 'Geist Mono', monospace; color: var(--faint); font-size: 18px; font-weight: 400; margin-left: 8px; }
.hero-card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 24px; display: grid; grid-template-columns: auto auto 1fr; gap: 24px; align-items: center; margin-top: 12px; }
.big-score { font-size: 72px; font-weight: 700; line-height: 1; letter-spacing: -0.02em; }
.big-score .score-out { font-size: 24px; color: var(--faint); font-weight: 500; }
.big-grade { font-size: 36px; font-weight: 700; padding: 12px 20px; border-radius: 8px; font-family: 'Geist Mono', monospace; color: #000; }
.hero-meta { display: flex; flex-direction: column; gap: 8px; color: var(--muted); font-size: 13px; }
.hero-meta strong { color: var(--text); }
.links { display: flex; gap: 12px; margin-top: 16px; flex-wrap: wrap; }
.btn { background: var(--surface); border: 1px solid var(--border); padding: 8px 14px; border-radius: 6px; color: var(--text); font-size: 13px; }
.btn:hover { border-color: var(--accent); text-decoration: none; }
.scorecard td:first-child { width: 40%; }
.scorecard .bar { width: 30%; }
.bar-track { height: 8px; background: var(--surface); border-radius: 4px; overflow: hidden; }
.bar-fill { height: 100%; background: var(--accent); }
.reasons-cell { color: var(--faint); font-size: 12px; }
.reasons { font-family: 'Geist Mono', monospace; font-size: 11px; }
pre { background: #000; border: 1px solid var(--border); border-radius: 6px; padding: 16px; overflow-x: auto; font-size: 13px; }
section { margin: 32px 0; }
section h2 { font-size: 16px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 500; }
@media (max-width: 720px) {
  .stats { grid-template-columns: repeat(2, 1fr); }
  .hero-card { grid-template-columns: 1fr; text-align: center; }
}
`;
}

function ogSvg(entry) {
  const color = GRADE_COLORS[entry.grade];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0a0a0a"/>
  <text x="60" y="100" fill="#a3a3a3" font-family="ui-monospace,monospace" font-size="24" letter-spacing="2">LLMS.TXT SCORE</text>
  <text x="60" y="200" fill="#e7e7e7" font-family="system-ui,sans-serif" font-size="68" font-weight="700">${esc(entry.display_name)}</text>
  <text x="60" y="248" fill="#6b6b6b" font-family="ui-monospace,monospace" font-size="24">${esc(entry.domain)}</text>
  <text x="60" y="430" fill="${color}" font-family="system-ui,sans-serif" font-size="180" font-weight="800">${entry.score}</text>
  <rect x="320" y="360" width="180" height="100" rx="10" fill="${color}"/>
  <text x="410" y="430" fill="#0a0a0a" font-family="ui-monospace,monospace" font-size="64" font-weight="800" text-anchor="middle">${esc(entry.grade)}</text>
  <text x="60" y="570" fill="#a3a3a3" font-family="system-ui,sans-serif" font-size="22">awesome-llms-txt · ${esc(entry.category)} · ${(entry.file_size_bytes/1024).toFixed(1)} KB</text>
  <text x="60" y="600" fill="#83CA16" font-family="system-ui,sans-serif" font-size="20">github.com/agentrhq/awesome-llms-txt</text>
</svg>`;
}

function main() {
  fs.mkdirSync(SITE_PAGES, { recursive: true });
  fs.mkdirSync(OG, { recursive: true });

  fs.writeFileSync(path.join(WEB, 'style.css'), styleCss());
  fs.writeFileSync(path.join(WEB, 'app.js'), appJs());
  fs.writeFileSync(path.join(WEB, 'index.html'), shell({
    title: 'Awesome llms.txt — the scored leaderboard',
    description: `${stats.total.toLocaleString()} llms.txt files scored against a public rubric. Stripe scored 69. Vercel scored 71. ${manifest.filter(e=>e.grade.startsWith('A')).length} sites got an A or A-.`,
    body: indexPageBody(),
    depth: 0,
  }));

  let count = 0;
  for (const entry of manifest) {
    const folder = entry.domain.replace(/[^a-zA-Z0-9._-]/g, '_');
    const scoreJsonPath = path.join(ROOT, 'sites', folder, 'score.json');
    if (!fs.existsSync(scoreJsonPath)) continue;
    const scoreJson = JSON.parse(fs.readFileSync(scoreJsonPath, 'utf8'));
    const og = ogSvg(entry);
    fs.writeFileSync(path.join(OG, entry.domain + '.svg'), og);
    fs.writeFileSync(path.join(SITE_PAGES, entry.domain + '.html'), shell({
      title: `${entry.display_name} — llms.txt score: ${entry.score} (${entry.grade})`,
      description: `${entry.display_name}'s llms.txt scored ${entry.score}/100, grade ${entry.grade}. ${entry.section_count} sections, ${entry.link_count} links.`,
      body: sitePageBody(entry, scoreJson),
      ogImage: `https://agentrhq.github.io/awesome-llms-txt/og/${entry.domain}.svg`,
    }));
    count++;
  }
  console.error(`wrote ${count} per-site HTML pages + ${count} OG cards`);
  console.error('also wrote: web/index.html, web/style.css, web/app.js');
}

main();
