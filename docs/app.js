
const GRADE_COLORS = {"A+":"#22c55e","A":"#22c55e","A-":"#4ade80","B+":"#84cc16","B":"#a3e635","C":"#eab308","D":"#f97316","F":"#ef4444"};
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
  document.querySelector('#board tbody').innerHTML = rows.map((e, i) => `
    <tr>
      <td class="num">${i + 1}</td>
      <td><a href="./site/${esc(e.domain)}.html">${esc(e.display_name)}</a></td>
      <td class="domain">${esc(e.domain)}</td>
      <td class="num"><strong>${e.score}</strong></td>
      <td><span class="grade-pill" style="background:${GRADE_COLORS[e.grade]}">${esc(e.grade)}</span></td>
      <td><span class="cat">${esc(e.category)}</span></td>
      <td class="num">${fmtAge(e.freshness_age_days)}</td>
      <td class="num">${fmtKB(e.file_size_bytes)}</td>
    </tr>`).join('');
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
