'use strict';

// Minimal SVG score badge in the same shape as shields.io's "badge" style.
// Two pills side by side: label (charcoal) and message (grade-colored).

const COLORS = {
  'A+': '#22c55e', 'A': '#22c55e', 'A-': '#4ade80',
  'B+': '#84cc16', 'B': '#a3e635',
  'C': '#eab308',
  'D': '#f97316',
  'F': '#ef4444',
};

function widthFor(text) {
  // Geist-y metrics: ~6.5px per char, +14 padding. Crude but consistent.
  return text.length * 6.5 + 14;
}

function escapeXml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function badge({ score, grade }) {
  const left = `llms.txt`;
  const right = `${score}  ${grade}`;
  const leftW = Math.round(widthFor(left));
  const rightW = Math.round(widthFor(right));
  const total = leftW + rightW;
  const color = COLORS[grade] || '#888';
  const leftSafe = escapeXml(left);
  const rightSafe = escapeXml(right);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="20" role="img" aria-label="llms.txt score: ${score} (${grade})">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <mask id="a"><rect width="${total}" height="20" rx="3" fill="#fff"/></mask>
  <g mask="url(#a)">
    <rect width="${leftW}" height="20" fill="#1f2937"/>
    <rect x="${leftW}" width="${rightW}" height="20" fill="${color}"/>
    <rect width="${total}" height="20" fill="url(#b)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Geist Mono, ui-monospace, monospace" font-size="11">
    <text x="${leftW / 2}" y="14">${leftSafe}</text>
    <text x="${leftW + rightW / 2}" y="14">${rightSafe}</text>
  </g>
</svg>`;
}

module.exports = { badge };
