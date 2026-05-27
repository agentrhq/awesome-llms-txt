'use strict';

const LINK_RE     = /\[([^\]]+)\]\(([^)\s]+)\)\s*:?\s*(.*)$/;
const BARE_URL_RE = /^\s*[-*]\s+(https?:\/\/\S+)\s*:?\s*(.*)$/;
const INLINE_URL  = /\bhttps?:\/\/[^\s)\]]+/g;

const LOW_VALUE_PATTERNS = [
  /\/blog(\/|$|\?|#)/i,
  /\/news(\/|$|\?|#)/i,
  /\/press(\/|$|\?|#)/i,
  /\/customer[-_]stor/i,
  /\/case[-_]stud/i,
  /\/events?(\/|$|\?|#)/i,
  /\/community\//i,
  /\/legal(\/|$|\?|#)/i,
  /\/privacy(\/|$|\?|#)/i,
  /\/terms(\/|$|\?|#)/i,
  /\/careers?(\/|$|\?|#)/i,
  /\/about(\/|$|\?|#)/i,
];

function isLowValue(url) {
  return LOW_VALUE_PATTERNS.some(re => re.test(url));
}

function parseItem(raw) {
  const m = LINK_RE.exec(raw);
  if (m) return { text: m[1].trim(), url: m[2].trim(), note: (m[3] || '').trim(), valid: true };
  const b = /^(https?:\/\/\S+)\s*(.*)$/.exec(raw);
  if (b) return { text: b[1], url: b[1].trim(), note: (b[2] || '').trim(), valid: true };
  return { text: raw.trim(), url: null, note: '', valid: false };
}

function parse(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const out = {
    h1: null,
    h1_line: null,
    h1_count: 0,
    blockquote: null,
    intro_paragraphs: [],
    intro_items: [],       // bullets that appear BEFORE the first H2
    sections: [],
    raw_lines: lines.length,
    raw_bytes: Buffer.byteLength(text, 'utf8'),
    has_optional_section: false,
    malformed: [],
    first_bullet_line: null,
  };

  let inFence = false;
  let curSection = null;     // last H2 section
  let curSubsection = null;  // last H3 subsection (a child of curSection)

  // Pass 1. Find first non-empty line, locate first H1 (outside fences).
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*```/.test(line)) { inFence = !inFence; continue; }
    if (inFence) continue;
    const m = /^#\s+(.+)$/.exec(line);
    if (m) {
      out.h1_count++;
      if (out.h1 === null) {
        out.h1 = m[1].trim();
        out.h1_line = i + 1;
      }
    }
  }
  if (!out.h1) out.malformed.push('no_h1');

  // Pass 2. Structural walk.
  inFence = false;
  let foundH1 = false;
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    if (/^\s*```/.test(rawLine)) { inFence = !inFence; continue; }
    if (inFence) continue;
    const line = rawLine;

    if (!foundH1) {
      if (/^#\s+\S/.test(line)) { foundH1 = true; continue; }
      continue;
    }

    const h2 = /^##\s+(.+)$/.exec(line);
    if (h2) {
      curSection = {
        title: h2[1].trim(),
        line: i + 1,
        description: [],
        items: [],
        subsections: [],
      };
      out.sections.push(curSection);
      curSubsection = null;
      if (/^optional$/i.test(curSection.title)) out.has_optional_section = true;
      continue;
    }

    const h3 = /^###\s+(.+)$/.exec(line);
    if (h3 && curSection) {
      curSubsection = {
        title: h3[1].trim(),
        line: i + 1,
        items: [],
      };
      curSection.subsections.push(curSubsection);
      continue;
    }

    const litem = /^\s*[-*]\s+(.+)$/.exec(line);
    if (litem) {
      if (out.first_bullet_line === null) out.first_bullet_line = i + 1;
      const item = parseItem(litem[1]);
      const target = curSubsection ? curSubsection.items
                  : curSection    ? curSection.items
                  :                  out.intro_items;
      target.push(item);
      continue;
    }

    if (!curSection) {
      // Pre-first-H2 territory: blockquote and intro paragraphs.
      const q = /^>\s*(.*)$/.exec(line);
      if (q) {
        if (out.blockquote === null) out.blockquote = q[1].trim();
        else out.blockquote += ' ' + q[1].trim();
        continue;
      }
      if (line.trim() === '') continue;
      if (/^#{1,6}\s/.test(line)) continue;
      out.intro_paragraphs.push(line.trim());
      continue;
    }

    if (line.trim() === '') continue;
    if (/^#{1,6}\s/.test(line)) continue;
    if (curSubsection) continue; // ignore prose inside H3 for now
    curSection.description.push(line.trim());
  }

  // Aggregate counts. Links live in: intro_items, section.items, section.subsections[i].items.
  const allItems = [
    ...out.intro_items,
    ...out.sections.flatMap(s => s.items),
    ...out.sections.flatMap(s => s.subsections.flatMap(ss => ss.items)),
  ];
  const validItems = allItems.filter(x => x.valid);
  out.link_count = validItems.length;
  out.invalid_item_count = allItems.length - validItems.length;
  out.section_count = out.sections.length;
  out.subsection_count = out.sections.reduce((a, s) => a + s.subsections.length, 0);
  out.intro_link_count = out.intro_items.filter(x => x.valid).length;
  // Inline URLs from intro/blockquote (e.g. "For full docs see https://x.com/y.md").
  const introText = (out.blockquote || '') + ' ' + out.intro_paragraphs.join(' ');
  const introInline = introText.match(INLINE_URL) || [];
  out.intro_inline_urls = introInline;

  // Low-value-link tagging.
  out.value_link_count = validItems.filter(x => !isLowValue(x.url)).length;
  out.low_value_link_count = validItems.length - out.value_link_count;

  // Effective sections = H2 + 0.5 * H3 (for coverage).
  out.effective_section_count = out.section_count + Math.floor(out.subsection_count / 2);

  return out;
}

module.exports = { parse, isLowValue };
