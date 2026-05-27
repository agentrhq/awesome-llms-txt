'use strict';

const assert = require('assert');
const { score } = require('../lib/score');
const { parse } = require('../lib/parse');
const { grade } = require('../lib/grade');

function eq(actual, expected, msg) {
  assert.strictEqual(actual, expected, `${msg}: expected ${expected}, got ${actual}`);
}

function comp(result, id) {
  return result.components.find(c => c.id === id);
}

// 1. Empty file scores low.
{
  const r = score('', { http_status: 200, content_type: 'text/plain; charset=utf-8' });
  assert(r.score < 30, `empty should score < 30, got ${r.score}`);
  eq(r.grade, 'F', 'empty grade');
}

// 2. Minimal valid spec scores B-ish.
{
  const txt = `# Example\n\n> A short summary of the project.\n\n## Docs\n\n- [Quickstart](https://example.com/quickstart.md): Get started in 5 minutes.\n- [API Reference](https://example.com/api.md): The full API.\n- [Errors](https://example.com/errors.md)\n\n## Auth\n\n- [Auth guide](https://example.com/auth.md): How to authenticate with OAuth.\n`;
  const r = score(txt, { http_status: 200, content_type: 'text/markdown; charset=utf-8' });
  assert(r.score >= 45 && r.score <= 75, `minimal valid should score 45-75, got ${r.score}`);
  assert(comp(r, 'spec_compliance').points >= 14, 'spec compliance high');
  assert(comp(r, 'auth_signposting').points >= 6, 'auth section found');
}

// 3. Parser handles blockquote, H2, link items.
{
  const p = parse(`# Site\n\n> summary\n\n## Docs\n\n- [A](https://a/x.md): note\n- [B](https://b/y.md)\n`);
  eq(p.h1, 'Site', 'h1');
  eq(p.h1_count, 1, 'one h1');
  eq(p.blockquote, 'summary', 'blockquote');
  eq(p.section_count, 1, 'one section');
  eq(p.sections[0].items.length, 2, 'two items');
  eq(p.link_count, 2, 'two links');
}

// 4. Grade bands.
eq(grade(100).grade, 'A+', 'grade 100');
eq(grade(95).grade, 'A+', 'grade 95');
eq(grade(85).grade, 'A', 'grade 85');
eq(grade(80).grade, 'A-', 'grade 80');
eq(grade(75).grade, 'B+', 'grade 75');
eq(grade(65).grade, 'B', 'grade 65');
eq(grade(50).grade, 'C', 'grade 50');
eq(grade(34).grade, 'F', 'grade 34');

// 5. Size discipline penalises bloat.
{
  const small = '# X\n\n## S\n' + Array.from({ length: 30 }, (_, i) => `- [L${i}](https://a/x${i}.md): note`).join('\n') + '\n';
  const huge  = '# X\n\n## S\n' + Array.from({ length: 20000 }, (_, i) => `- [L${i}](https://a/x${i}.md)`).join('\n');
  const sa = comp(score(small, { http_status: 200, content_type: 'text/markdown; charset=utf-8' }), 'size_discipline').points;
  const sb = comp(score(huge,  { http_status: 200, content_type: 'text/markdown; charset=utf-8' }), 'size_discipline').points;
  assert(sa > sb, `size discipline must drop on bloat: small=${sa}, huge=${sb}`);
}

// 6. PATCH: bare-URL bullets are valid links (no markdown link syntax).
{
  const txt = `# Cohere\n\n> Cohere docs.\n\n## Top-level\n\n- https://docs.cohere.com/v2/docs/the-cohere-platform\n- https://docs.cohere.com/v2/docs/models\n- https://docs.cohere.com/v2/docs/chat-api\n`;
  const p = parse(txt);
  eq(p.link_count, 3, 'bare-url bullets counted as links');
  eq(p.sections[0].items[0].url, 'https://docs.cohere.com/v2/docs/the-cohere-platform', 'first bare url');
}

// 7. PATCH: links outside any H2 (flat file) are still counted.
{
  const txt = `# Kotlin\n\n> Kotlin docs.\n\n- [Getting started](https://kotlinlang.org/docs/getting-started.html)\n- [Tour of Kotlin](https://kotlinlang.org/docs/kotlin-tour-hello-world.html)\n- [Language reference](https://kotlinlang.org/docs/reference.html)\n`;
  const p = parse(txt);
  eq(p.intro_link_count, 3, 'three intro links');
  eq(p.link_count, 3, 'all three counted in link_count');
}

// 8. PATCH: H3 inside a section counts toward auth_signposting.
{
  const txt = `# Postmark\n\n> Email API.\n\n## API\n\n- [API](https://postmarkapp.com/api.md)\n\n### Authentication\n\n- [Auth tokens](https://postmarkapp.com/auth.md): How to authenticate with the Postmark API using server tokens.\n`;
  const r = score(txt, { http_status: 200, content_type: 'text/markdown; charset=utf-8' });
  assert(comp(r, 'auth_signposting').points >= 6, `H3 auth section found, got ${comp(r, 'auth_signposting').points}`);
}

// 9. PATCH: ## Credentials / ## Access also satisfy auth signposting (section grants 5).
{
  const txt = `# Vercel\n\n> Hosting.\n\n## Access\n\n- [Login](https://vercel.com/login.md)\n- [Tokens](https://vercel.com/account/tokens.md): Create API tokens for the Vercel CLI and authenticated requests.\n`;
  const r = score(txt, { http_status: 200, content_type: 'text/markdown; charset=utf-8' });
  assert(comp(r, 'auth_signposting').points >= 5, `## Access counts as auth section, got ${comp(r, 'auth_signposting').points}`);

  // Same shape, with auth keywords in body, should get the full 8.
  const txt2 = `# Clerk\n\n> Auth as a service. OAuth, API keys, bearer tokens.\n\n## Access\n\n- [OAuth](https://clerk.com/oauth.md): OAuth flows.\n`;
  const r2 = score(txt2, { http_status: 200, content_type: 'text/markdown; charset=utf-8' });
  assert(comp(r2, 'auth_signposting').points === 8, `keywords + section = 8, got ${comp(r2, 'auth_signposting').points}`);
}

// 10. PATCH: no-H1 hard floor.
{
  const txt = `## Topics\n\n- [Foo](https://x.com/foo.md)\n- [Bar](https://x.com/bar.md)\n`;
  const r = score(txt, { http_status: 200, content_type: 'text/markdown; charset=utf-8' });
  assert(comp(r, 'spec_compliance').points <= 6, `no-H1 hard floor: got ${comp(r, 'spec_compliance').points}`);
}

// 11. PATCH: multi-H1 penalty.
{
  const a = `# Single\n\n> ok\n\n## A\n\n- [x](https://x.com/y.md)\n`;
  const b = `# First\n\n> ok\n\n# Second\n\n## A\n\n- [x](https://x.com/y.md)\n`;
  const ra = score(a, { http_status: 200, content_type: 'text/markdown; charset=utf-8' });
  const rb = score(b, { http_status: 200, content_type: 'text/markdown; charset=utf-8' });
  assert(comp(ra, 'spec_compliance').points > comp(rb, 'spec_compliance').points,
    `multi-H1 should score worse: single=${comp(ra,'spec_compliance').points}, multi=${comp(rb,'spec_compliance').points}`);
}

// 12. PATCH: buried H1 (line > 5) forfeits the points grant.
{
  const buried = `> intro blockquote\n\nintro paragraph one\n\nintro paragraph two\n\nintro paragraph three\n\n# Site\n\n## Docs\n\n- [x](https://x.com/y.md)\n`;
  const top    = `# Site\n\n> intro\n\n## Docs\n\n- [x](https://x.com/y.md)\n`;
  const rb = score(buried, { http_status: 200, content_type: 'text/markdown; charset=utf-8' });
  const rt = score(top,    { http_status: 200, content_type: 'text/markdown; charset=utf-8' });
  assert(comp(rt, 'spec_compliance').points > comp(rb, 'spec_compliance').points,
    `buried H1 must score worse than top: top=${comp(rt,'spec_compliance').points}, buried=${comp(rb,'spec_compliance').points}`);
}

// 13. PATCH: low-value links don't count toward coverage.
{
  const blogHeavy = `# X\n\n> X\n\n## Posts\n\n` + Array.from({ length: 50 }, (_, i) => `- [Post ${i}](https://x.com/blog/post-${i})`).join('\n');
  const docHeavy  = `# X\n\n> X\n\n## Docs\n\n`  + Array.from({ length: 50 }, (_, i) => `- [Doc ${i}](https://x.com/docs/page-${i}.md)`).join('\n');
  const rb = score(blogHeavy, { http_status: 200, content_type: 'text/markdown; charset=utf-8' });
  const rd = score(docHeavy,  { http_status: 200, content_type: 'text/markdown; charset=utf-8' });
  assert(comp(rd, 'coverage').points > comp(rb, 'coverage').points,
    `doc-heavy coverage > blog-heavy: docs=${comp(rd,'coverage').points}, blog=${comp(rb,'coverage').points}`);
}

// 14. PATCH: code-fenced "# heading" lines are not parsed as H1.
{
  const txt = '# Real\n\n> ok\n\n```bash\n# This is a comment\necho hi\n```\n\n## Docs\n\n- [x](https://x.com/y.md)\n';
  const p = parse(txt);
  eq(p.h1_count, 1, 'fenced # not counted as H1');
}

// 15. PATCH: em-dashes inside list-item titles don't trip Voice; intro em-dashes do.
{
  const safe   = `# Kotlin\n\n> Concise docs.\n\n## Tutorials\n\n- [React and Kotlin/JS — tutorial](https://kotlinlang.org/docs/react.html)\n`;
  const unsafe = `# Kotlin\n\n> Concise docs — but wordy.\n\n## Tutorials\n\n- [Plain](https://kotlinlang.org/docs/react.html)\n`;
  const a = score(safe,   { http_status: 200, content_type: 'text/markdown; charset=utf-8' });
  const b = score(unsafe, { http_status: 200, content_type: 'text/markdown; charset=utf-8' });
  eq(comp(a, 'voice').points, 2, 'em-dash inside list item is fine');
  assert(comp(b, 'voice').points < 2, 'em-dash in intro is penalised');
}

// 16. PATCH: Last-Modified plumbing affects freshness.
{
  const txt = '# X\n\n> X\n\n## A\n\n- [x](https://x.com/y.md)\n';
  const fresh = score(txt, { http_status: 200, content_type: 'text/markdown; charset=utf-8', last_modified: new Date(Date.now() - 3 * 86400000).toUTCString(), now: new Date().toISOString() });
  const stale = score(txt, { http_status: 200, content_type: 'text/markdown; charset=utf-8', last_modified: new Date(Date.now() - 400 * 86400000).toUTCString(), now: new Date().toISOString() });
  const noLM  = score(txt, { http_status: 200, content_type: 'text/markdown; charset=utf-8' });
  assert(comp(fresh, 'freshness').points >= 9, `fresh = ${comp(fresh,'freshness').points}`);
  assert(comp(stale, 'freshness').points <= 3, `stale = ${comp(stale,'freshness').points}`);
  eq(comp(noLM,  'freshness').points, 5, 'no LM = neutral 5');
}

// 17. PATCH: mojibake docks 1 point on content_type.
{
  const txt = '# Mojibake\n\n> Our worldâ€™s favourite docs.\n\n## A\n\n- [x](https://x.com/y.md)\n';
  const r = score(txt, { http_status: 200, content_type: 'text/markdown; charset=utf-8' });
  assert(comp(r, 'content_type').points <= 3, `mojibake should dock content_type, got ${comp(r,'content_type').points}`);
}

console.log('all tests passed');
