'use strict';

const BANDS = [
  { min: 95, grade: 'A+', color: 'brightgreen' },
  { min: 85, grade: 'A',  color: 'brightgreen' },
  { min: 80, grade: 'A-', color: 'green' },
  { min: 75, grade: 'B+', color: 'green' },
  { min: 65, grade: 'B',  color: 'yellowgreen' },
  { min: 50, grade: 'C',  color: 'yellow' },
  { min: 35, grade: 'D',  color: 'orange' },
  { min: 0,  grade: 'F',  color: 'red' },
];

function grade(score) {
  for (const b of BANDS) if (score >= b.min) return b;
  return BANDS[BANDS.length - 1];
}

module.exports = { grade, BANDS };
