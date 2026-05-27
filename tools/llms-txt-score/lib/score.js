'use strict';

const { parse, isLowValue } = require('./parse');
const { grade } = require('./grade');

const RUBRIC = [
  { id: 'spec_compliance',   label: 'Spec compliance',           max: 18 },
  { id: 'coverage',          label: 'Coverage',                   max: 20 },
  { id: 'agent_actions',     label: 'Agent-action declarations',  max: 14 },
  { id: 'link_stability',    label: 'Linked-content stability',   max: 10 },
  { id: 'freshness',         label: 'Freshness',                  max: 10 },
  { id: 'discoverability',   label: 'Discoverability',            max: 8 },
  { id: 'auth_signposting',  label: 'Auth signposting',           max: 8 },
  { id: 'size_discipline',   label: 'Size discipline',            max: 6 },
  { id: 'content_type',      label: 'Content-Type & encoding',    max: 4 },
  { id: 'voice',             label: 'Voice',                       max: 2 },
];

const CANONICAL_SECTIONS = [
  'docs', 'documentation', 'api', 'api reference', 'reference', 'quickstart',
  'guides', 'guide', 'tutorial', 'tutorials', 'sdk', 'sdks', 'cli',
  'auth', 'authentication', 'examples', 'pricing', 'webhooks', 'errors',
  'changelog', 'integrations', 'products', 'platform', 'mcp', 'agents',
  'getting started',
];

const AUTH_HEADING_RE = /^(auth|authentication|authorization|api[- ]?keys?|credentials|access(\s+tokens?)?|api\s+authentication|user\s+authentication|security|access\s+control)$/i;

const MARKETING_PHRASES = [
  'industry-leading', 'industry leading', 'best-in-class', 'best in class',
  'revolutionary', 'cutting-edge', 'cutting edge', 'world-class', 'world class',
  'next-generation', 'next generation', 'game-changing', 'game changing',
  'mission-critical', 'enterprise-grade', 'one-stop', 'all-in-one solution',
  'seamlessly', 'effortlessly', 'unlock the power', 'leverage the power',
];

const MOJIBAKE_RE = /Ã[-ÿ]|â€[™œ]|Â[ -¿]/;

function scoreSpecCompliance(p) {
  const reasons = [];
  let pts = 0;

  if (p.h1) {
    if (p.h1_line && p.h1_line > 5) {
      reasons.push('h1_buried');           // no point grant when buried
    } else {
      pts += 3;
    }
    if (!/^https?:/i.test(p.h1)) pts += 1; else reasons.push('h1_is_url');
  } else {
    reasons.push('no_h1');
  }
  if (p.h1_count > 1) { pts = Math.max(0, pts - 2); reasons.push(`multi_h1_${p.h1_count}`); }

  if (p.blockquote) pts += 2; else reasons.push('no_blockquote_summary');

  // H2 sections present
  if (p.section_count >= 1) pts += 2;
  if (p.section_count >= 2) pts += 1;
  if (p.section_count === 0 && p.intro_link_count === 0) reasons.push('no_structure');

  // H2 sections contain link lists
  const sectionsWithLinks = p.sections.filter(s => s.items.some(x => x.valid) || s.subsections.some(ss => ss.items.some(x => x.valid))).length;
  if (p.section_count > 0) {
    const ratio = sectionsWithLinks / p.section_count;
    pts += Math.round(ratio * 4);
    if (ratio < 0.8) reasons.push('sections_without_link_lists');
  } else if (p.intro_link_count > 0) {
    // Flat file with no H2 but real links — partial credit.
    pts += 2;
  }

  // Link items follow expected grammar
  const totalItems = p.link_count + p.invalid_item_count;
  if (totalItems > 0) {
    const validRatio = p.link_count / totalItems;
    pts += Math.round(validRatio * 3);
    if (validRatio < 0.9) reasons.push('malformed_link_items');
  }

  // No structural malformations
  if (p.malformed.length === 0) pts += 2;

  // Hard floor: if no H1, cap at 6 regardless of how clean the rest is.
  if (!p.h1) pts = Math.min(pts, 6);
  return { id: 'spec_compliance', max: 18, points: Math.min(18, Math.max(0, pts)), reasons };
}

function scoreCoverage(p) {
  const reasons = [];
  let pts = 0;

  // Effective sections cap 5
  if (p.effective_section_count >= 1) pts += 1;
  if (p.effective_section_count >= 2) pts += 1;
  if (p.effective_section_count >= 4) pts += 1;
  if (p.effective_section_count >= 6) pts += 1;
  if (p.effective_section_count >= 8) pts += 1;
  if (p.effective_section_count < 3 && p.intro_link_count < 5) reasons.push('thin_sectioning');

  // Use VALUE link count (blog / customer-story / careers discounted).
  const lc = p.value_link_count;
  let linkPts = 0;
  if (lc >= 5)   linkPts = 3;
  if (lc >= 15)  linkPts = 5;
  if (lc >= 40)  linkPts = 7;
  if (lc >= 80)  linkPts = 8;
  if (lc >= 150) linkPts = 9;
  if (lc >= 300) linkPts = 10;
  pts += linkPts;
  if (p.low_value_link_count >= 10 && p.low_value_link_count >= p.value_link_count) {
    reasons.push(`mostly_low_value_${p.low_value_link_count}_of_${p.link_count}`);
  }
  if (lc < 10) reasons.push('few_value_links');

  // Section diversity (5)
  const allTitles = [
    ...p.sections.map(s => s.title.toLowerCase()),
    ...p.sections.flatMap(s => s.subsections.map(ss => ss.title.toLowerCase())),
  ];
  const hits = CANONICAL_SECTIONS.filter(n =>
    allTitles.some(t => t === n || t.includes(n)),
  ).length;
  pts += Math.min(5, hits);
  if (hits < 2) reasons.push('missing_canonical_sections');

  return { id: 'coverage', max: 20, points: Math.min(20, pts), reasons };
}

function scoreAgentActions(p) {
  const reasons = [];
  let pts = 0;
  const sectionItems = [
    ...p.intro_items,
    ...p.sections.flatMap(s => s.items),
    ...p.sections.flatMap(s => s.subsections.flatMap(ss => ss.items)),
  ].filter(x => x.valid);
  const sectionUrls = sectionItems.map(x => x.url);
  const titles = sectionItems.map(x => x.text.toLowerCase());
  const introText = p.intro_paragraphs.join(' ') + ' ' + (p.blockquote || '');
  const introUrls = (introText.match(/\bhttps?:\/\/[^\s)\]]+/g) || []);
  const urls = sectionUrls.concat(introUrls);
  const body = (introText + ' ' + p.sections.map(s => s.description.join(' ')).join(' ')).toLowerCase();

  const hasFull = urls.some(u => /llms-?full\.txt$/i.test(u)) || urls.some(u => /\/llms-full/i.test(u));
  if (hasFull) pts += 3; else reasons.push('no_llms_full_link');

  const mdLinks = urls.filter(u => /\.md(\?|#|$)/i.test(u)).length;
  if (urls.length > 0) {
    const mdRatio = mdLinks / urls.length;
    if (mdRatio >= 0.8) pts += 5;
    else if (mdRatio >= 0.5) pts += 4;
    else if (mdRatio >= 0.2) pts += 3;
    else if (mdRatio > 0)    pts += 1;
    else reasons.push('no_md_url_twins');
  }

  const agentSignals = [
    /\bmcp\b/i, /\bagent[-\s]skills?\b/i, /\.well-known\//i, /\bopenapi\b/i,
    /openai-plugin/i, /\bllms-?ctx/i, /a2a/i,
  ];
  const signalHits = agentSignals.filter(re =>
    re.test(body) || titles.some(t => re.test(t)) || urls.some(u => re.test(u)),
  ).length;
  pts += Math.min(3, signalHits);
  if (signalHits === 0) reasons.push('no_agent_signposts');

  const hasApiSpec = urls.some(u => /openapi|swagger|api\.json|api\.yaml/i.test(u))
                  || titles.some(t => /openapi|api spec/i.test(t));
  if (hasApiSpec) pts += 3; else reasons.push('no_machine_readable_api_spec');

  return { id: 'agent_actions', max: 14, points: Math.min(14, pts), reasons };
}

function scoreLinkStability(p, opts = {}) {
  const reasons = [];
  if (opts.link_check && opts.link_check.sampled > 0) {
    const { sampled, ok } = opts.link_check;
    const ratio = ok / sampled;
    const pts = Math.round(ratio * 10);
    if (ratio < 1) reasons.push(`broken_links_${sampled - ok}_of_${sampled}_sampled`);
    return { id: 'link_stability', max: 10, points: pts, reasons, sampled, ok };
  }
  reasons.push('not_sampled');
  return { id: 'link_stability', max: 10, points: 6, reasons, note: 'unverified default 6/10; CI re-checks live' };
}

function scoreFreshness(p, opts = {}) {
  const reasons = [];
  if (opts.last_modified) {
    const lm = new Date(opts.last_modified).getTime();
    if (Number.isFinite(lm)) {
      const now = (opts.now ? new Date(opts.now).getTime() : Date.now());
      const days = Math.floor((now - lm) / (1000 * 60 * 60 * 24));
      let pts;
      if (days <= 7) pts = 10;
      else if (days <= 30) pts = 9;
      else if (days <= 90) pts = 7;
      else if (days <= 180) pts = 5;
      else if (days <= 365) pts = 3;
      else pts = 1;
      if (days > 90) reasons.push(`stale_${days}_days`);
      return { id: 'freshness', max: 10, points: pts, reasons, age_days: days, source: 'last_modified' };
    }
  }
  reasons.push('no_last_modified_header');
  return { id: 'freshness', max: 10, points: 5, reasons, note: 'unverified default 5/10', source: 'default' };
}

function scoreDiscoverability(p, opts = {}) {
  const reasons = [];
  let pts = 0;
  if (opts.http_status === 200) pts += 5;
  else reasons.push(`http_${opts.http_status || 'unknown'}`);
  if (opts.fetched_url && opts.final_url) {
    const a = opts.fetched_url.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    const b = opts.final_url.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    if (a === b) pts += 2;
    else reasons.push('redirect_chain');
  } else {
    pts += 1;
  }
  pts += 1; // no_auth_wall presumed (we don't fetch from behind logins)
  return { id: 'discoverability', max: 8, points: Math.min(8, pts), reasons };
}

function scoreAuthSignposting(p) {
  const reasons = [];
  let pts = 0;
  const body = (p.h1 || '') + ' ' + (p.blockquote || '') + ' ' +
    p.intro_paragraphs.join(' ') + ' ' +
    p.sections.map(s => s.title + ' ' + s.description.join(' ') + ' ' + s.items.map(i => i.text + ' ' + i.note).join(' ') + ' ' +
      s.subsections.map(ss => ss.title + ' ' + ss.items.map(i => i.text + ' ' + i.note).join(' ')).join(' ')).join(' ');
  const lc = body.toLowerCase();
  const keywords = [
    /\bauth(entication)?\b/, /\bapi[\s-]?key/, /\boauth\b/, /\bbearer\b/,
    /\bauthorization\b/, /\baccess token/, /\bpersonal access token/,
  ];
  const kwHits = keywords.filter(re => re.test(lc)).length;
  if (kwHits >= 3) pts += 3;
  else if (kwHits >= 1) pts += 2;
  else reasons.push('no_auth_keywords');

  // Dedicated auth section — H2 OR H3
  const h2Match = p.sections.find(s => AUTH_HEADING_RE.test(s.title));
  const h3Match = p.sections.flatMap(s => s.subsections).find(ss => AUTH_HEADING_RE.test(ss.title));
  if (h2Match) pts += 5;
  else if (h3Match) pts += 4;
  else if (p.sections.some(s => /auth|credential|access/i.test(s.title))) pts += 3;
  else if (p.sections.some(s => s.subsections.some(ss => /auth|credential|access/i.test(ss.title)))) pts += 2;
  else reasons.push('no_auth_section');

  return { id: 'auth_signposting', max: 8, points: Math.min(8, pts), reasons };
}

function scoreSizeDiscipline(p) {
  const reasons = [];
  const kb = p.raw_bytes / 1024;
  let pts;
  if (p.raw_bytes < 200) { pts = 0; reasons.push('empty_or_stub'); }
  else if (kb < 8) pts = 6;
  else if (kb < 32) pts = 5;
  else if (kb < 64) pts = 4;
  else if (kb < 128) pts = 2;
  else if (kb < 512) pts = 1;
  else pts = 0;
  if (kb >= 64) reasons.push(`oversized_${Math.round(kb)}kb`);
  return { id: 'size_discipline', max: 6, points: pts, reasons, kb: Math.round(kb * 10) / 10 };
}

function scoreContentType(p, opts = {}) {
  const reasons = [];
  let pts = 0;
  const ct = (opts.content_type || '').toLowerCase();
  if (/^text\/markdown/.test(ct)) pts += 3;
  else if (/^text\/plain/.test(ct)) pts += 3;
  else if (/^text\//.test(ct)) { pts += 2; reasons.push(`unexpected_content_type_${ct}`); }
  else reasons.push(`bad_content_type_${ct || 'unknown'}`);
  if (/utf-?8/.test(ct)) pts += 1; else reasons.push('no_utf8_charset');

  // Mojibake / wrong-encoding detector — penalise even if Content-Type looked right.
  const introSample = ((p.blockquote || '') + ' ' + p.intro_paragraphs.join(' ')).slice(0, 4000);
  if (MOJIBAKE_RE.test(introSample)) {
    pts = Math.max(0, pts - 1);
    reasons.push('mojibake_in_body');
  }
  return { id: 'content_type', max: 4, points: Math.min(4, pts), reasons };
}

function scoreVoice(p) {
  const reasons = [];
  let pts = 2;
  const body = ((p.blockquote || '') + ' ' + p.intro_paragraphs.join(' ') + ' ' +
    p.sections.map(s => s.description.join(' ') + ' ' + s.items.map(i => i.note).join(' ')).join(' ')).toLowerCase();
  let marketingHits = 0;
  for (const phrase of MARKETING_PHRASES) if (body.includes(phrase)) marketingHits++;
  if (marketingHits >= 2) { pts -= 1; reasons.push('marketing_fluff'); }

  // Em-dash check is restricted to the intro PROSE before the first bullet, not the whole file.
  // Reason: list-item titles often include em-dashes legitimately (e.g. "React and Kotlin/JS — tutorial").
  const introProse = (p.blockquote || '') + ' ' + p.intro_paragraphs.join(' ');
  if (/—/.test(introProse)) {
    if (pts > 0) { pts -= 1; reasons.push('em_dashes_in_intro'); }
  }
  return { id: 'voice', max: 2, points: Math.max(0, pts), reasons };
}

function score(text, opts = {}) {
  const p = parse(text);
  const components = [
    scoreSpecCompliance(p),
    scoreCoverage(p),
    scoreAgentActions(p),
    scoreLinkStability(p, opts),
    scoreFreshness(p, opts),
    scoreDiscoverability(p, opts),
    scoreAuthSignposting(p),
    scoreSizeDiscipline(p),
    scoreContentType(p, opts),
    scoreVoice(p),
  ];
  const total = components.reduce((s, c) => s + c.points, 0);
  const g = grade(total);
  return {
    schema_version: 2,
    score: total,
    grade: g.grade,
    color: g.color,
    components,
    parsed: {
      h1: p.h1,
      h1_count: p.h1_count,
      blockquote: p.blockquote,
      section_count: p.section_count,
      subsection_count: p.subsection_count,
      link_count: p.link_count,
      value_link_count: p.value_link_count,
      low_value_link_count: p.low_value_link_count,
      raw_bytes: p.raw_bytes,
    },
  };
}

module.exports = { score, RUBRIC };
