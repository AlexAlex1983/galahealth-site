/* Lung Health Atlas — renders data/atlas.json on a world map (data/world.json).
   Every number shown comes from the data files; sources are listed under the map. */
{
const METRICS = [
  {k: 'readiness', tab: 'Care readiness', label: 'Lung-care readiness (WHO survey items reported in place)', unit: 'of 5', kind: 'score',
   def: 'Count of five WHO Country Capacity Survey items a country reports: spirometry in primary care, national guidelines for chronic respiratory disease, an operational chronic respiratory disease plan, bronchodilators and steroid inhalers generally available. A GALA Health summary, not a WHO index.'},
  {k: 'crd_death_rate_who', tab: 'Deaths', label: 'Chronic respiratory disease death rate', unit: 'per 100,000', kind: 'bad', dec: 1, minYear: 2015,
   def: 'Age-standardised deaths from chronic respiratory diseases, from countries reporting to the WHO Mortality Database. Many low- and middle-income countries do not report, so they show as no data; reports older than 2015 are not shown.'},
  {k: 'ncd_premature', tab: 'Premature NCD deaths', label: 'Chance of dying aged 30–70 from a major NCD', unit: '%', kind: 'bad', dec: 1,
   def: 'Probability of dying between 30 and 70 from cardiovascular disease, cancer, diabetes or chronic respiratory disease (SDG 3.4.1).'},
  {k: 'hap_death_rate', tab: 'Household smoke', label: 'Deaths from household air pollution', unit: 'per 100,000', kind: 'bad', dec: 0,
   def: 'Age-standardised death rate attributed to household air pollution from cooking with polluting fuels.'},
  {k: 'clean_fuels', tab: 'Clean cooking', label: 'People relying on clean cooking fuels', unit: '%', kind: 'good', dec: 0,
   def: 'Share of the population mainly using clean fuels and technologies for cooking (electricity, gas, biogas and similar).'},
  {k: 'pm25', tab: 'Outdoor air', label: 'Average PM2.5 exposure', unit: 'µg/m³', kind: 'bad', dec: 1, ref: [5, 'WHO guideline: 5 µg/m³ annual mean'],
   def: 'Population-weighted annual mean concentration of fine particles (PM2.5).'},
  {k: 'smoking', tab: 'Tobacco', label: 'Adults who use tobacco', unit: '%', kind: 'bad', dec: 0,
   def: 'Age-standardised share of adults who smoke or use tobacco.'}
];
const POLICY = [
  ['spirometry', 'Spirometry generally available in primary care'],
  ['peak_flow', 'Peak-flow measurement generally available in primary care'],
  ['crd_guidelines', 'National guidelines for managing chronic respiratory disease'],
  ['crd_plan', 'Operational plan for chronic respiratory diseases'],
  ['ncd_plan', 'Operational multisectoral national NCD plan'],
  ['bronchodilators', 'Bronchodilators generally available (public sector)'],
  ['steroid_inhalers', 'Steroid inhalers generally available (public sector)'],
  ['combo_inhaler', 'Budesonide-formoterol inhaler generally available (public sector)']
];
const READY = ['spirometry', 'crd_guidelines', 'crd_plan', 'bronchodilators', 'steroid_inhalers'];
const BAD = ['#fde9d4', '#fbc58f', '#f88623', '#d1561a', '#8f2f14'];
const BLUE = ['#e8eef6', '#c3d4e8', '#97b6d8', '#6592c0', '#3a6aa0', '#152d53'];
const NODATA = '#d6d6d6';

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const isYes = v => typeof v === 'string' && /^(yes|generally available)/i.test(v);
const fmt = (v, m) => m.kind === 'score' ? `${v} of 5` : `${Number(v).toLocaleString('en', {maximumFractionDigits: m.dec ?? 1, minimumFractionDigits: m.dec ?? 1})}${m.unit === '%' ? '%' : ' ' + m.unit}`;

// Equal Earth projection
const A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796, M = Math.sqrt(3) / 2;
function proj(lon, lat) {
  const l = lon * Math.PI / 180, p = lat * Math.PI / 180, t = Math.asin(M * Math.sin(p)), t2 = t * t, t6 = t2 * t2 * t2;
  const x = l * Math.cos(t) / (M * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2)));
  const y = t * (A1 + A2 * t2 + t6 * (A3 + A4 * t2));
  return [(x + 2.7066) * 180, (1.3173 - y) * 180];
}

let DATA, WORLD, metric, selected = null, sortDesc = true, showAll = false;

function value(c, k) {
  if (!c) return null;
  if (k === 'readiness') {
    const have = READY.filter(x => c[x]);
    return have.length === READY.length ? READY.filter(x => isYes(c[x][0])).length : null;
  }
  const v = c[k], m = METRICS.find(x => x.k === k);
  if (m && m.minYear && v && v[1] < m.minYear) return null;  // skip stale reports
  return v && typeof v[0] === 'number' ? v[0] : null;
}
function year(c, k) {
  if (k === 'readiness') return c && c.spirometry ? c.spirometry[1] : '';
  return c && c[k] ? c[k][1] : '';
}

function bins(m) {
  if (m.kind === 'score') return null;
  const vals = Object.values(DATA.countries).map(c => value(c, m.k)).filter(v => v != null).sort((a, b) => a - b);
  const q = [0.2, 0.4, 0.6, 0.8].map(p => vals[Math.floor(p * (vals.length - 1))]);
  return {q, vals};
}
function color(v, m, b) {
  if (v == null) return NODATA;
  if (m.kind === 'score') return BLUE[v];
  let i = b.q.findIndex(t => v <= t); if (i < 0) i = 4;
  return BAD[m.kind === 'good' ? 4 - i : i];
}

function drawMap() {
  const b = bins(metric);
  const paths = WORLD.map(f => {
    const d = f.r.map(r => 'M' + r.map(([x, y]) => proj(x, y).map(n => n.toFixed(1)).join(',')).join('L') + 'Z').join('');
    const c = DATA.countries[f.a];
    return `<path d="${d}" fill="${color(value(c, metric.k), metric, b)}" fill-rule="evenodd" data-a="${esc(f.a)}" class="${f.a === selected ? 'sel' : ''}"><title>${esc(c ? c.name : f.n)}</title></path>`;
  }).join('');
  $('#atlas-svg').innerHTML = paths;
  const sel = $('#atlas-svg .sel'); if (sel) sel.parentNode.appendChild(sel);
  // legend
  let items;
  if (metric.kind === 'score') items = BLUE.map((c, i) => [c, `${i}`]);
  else {
    const e = [b.vals[0], ...b.q, b.vals[b.vals.length - 1]];
    items = [0, 1, 2, 3, 4].map(i => [BAD[metric.kind === 'good' ? 4 - i : i], `${fmtShort(e[i])}–${fmtShort(e[i + 1])}`]);
  }
  items.push([NODATA, 'No data']);
  $('#atlas-legend').innerHTML = `<span>${esc(metric.unit === 'of 5' ? 'Items in place' : metric.unit)}:</span>` + items.map(([c, t]) => `<span><i style="background:${c}"></i>${esc(t)}</span>`).join('');
  const src = DATA.sources[metric.k] || DATA.sources.spirometry;
  $('#atlas-def').innerHTML = `${esc(metric.def)}${metric.ref ? ' ' + esc(metric.ref[1]) + '.' : ''} Source: <a href="${esc(src.url)}" target="_blank" rel="noopener">${esc(src.source)}</a>${src.years ? `, ${esc(src.years[0] === src.years[1] ? src.years[0] : src.years.join('–'))}` : ''}.`;
}
function fmtShort(v) { return v >= 100 ? Math.round(v) : Math.round(v * 10) / 10; }

function percentile(v, m) {
  const vals = bins(m).vals; return Math.round(vals.filter(x => x < v).length / vals.length * 100);
}

function profile() {
  const box = $('#atlas-profile');
  if (!selected || !DATA.countries[selected]) {
    const all = Object.values(DATA.countries).filter(c => c.spirometry);
    const spiro = all.filter(c => isYes(c.spirometry[0])).length;
    const plan = all.filter(c => c.crd_plan && isYes(c.crd_plan[0])).length;
    const fuels = Object.values(DATA.countries).filter(c => value(c, 'clean_fuels') != null && value(c, 'clean_fuels') < 50).length;
    box.innerHTML = `<h2>Choose a country</h2><p class="sub">Tap the map or search to open a country profile.</p>
      <div class="atlas-stats">
        <div class="atlas-stat"><b>${spiro} of ${all.length}</b><span>countries report spirometry generally available in primary care</span><small>WHO Country Capacity Survey, ${esc(DATA.sources.spirometry ? DATA.sources.spirometry.years[1] : '')}</small></div>
        <div class="atlas-stat"><b>${plan} of ${all.filter(c => c.crd_plan).length}</b><span>countries report an operational plan for chronic respiratory diseases</span><small>WHO Country Capacity Survey</small></div>
        <div class="atlas-stat"><b>${fuels}</b><span>countries where most people still cook with polluting fuels</span><small>WHO / World Bank</small></div>
      </div>`;
    return;
  }
  const c = DATA.countries[selected];
  const stats = METRICS.filter(m => m.kind !== 'score' && value(c, m.k) != null).map(m => {
    const v = value(c, m.k), p = percentile(v, m);
    const word = m.kind === 'good' ? `Higher than ${p}% of countries` : `Higher than ${p}% of countries`;
    return `<div class="atlas-stat"><b>${esc(fmt(v, m))}</b><span>${esc(m.label)}</span>
      <div class="atlas-bar-mini" aria-hidden="true"><i style="left:calc(${p}% - 2px)"></i></div><small>${esc(word)} · ${esc(year(c, m.k))}</small></div>`;
  }).join('');
  const pol = POLICY.filter(([k]) => c[k]).map(([k, t]) => {
    const v = c[k][0], y = isYes(v);
    return `<li><span aria-hidden="true" style="color:${y ? '#2f8f57' : /^no/i.test(v) ? '#c9372c' : '#888'};font-weight:800">${y ? '✓' : /^no/i.test(v) ? '✗' : '–'}</span> ${esc(t)}${y || /^no/i.test(v) ? '' : ` <small>(${esc(v)})</small>`}</li>`;
  }).join('');
  const r = value(c, 'readiness');
  box.innerHTML = `<h2>${esc(c.name)}</h2>
    <p class="sub">${c.population ? esc(Math.round(c.population[0] / 1e5) / 10 >= 1 ? (c.population[0] / 1e6).toFixed(1) + ' million people' : Math.round(c.population[0]).toLocaleString('en') + ' people') : ''}${r != null ? ` · Lung-care readiness ${r} of 5` : ''}</p>
    <div class="atlas-stats">${stats || '<p>No indicator data for this country.</p>'}</div>
    ${pol ? `<h3 class="t-h3" style="font-size:18px;margin-top:22px;color:var(--navy)">Policy and services (WHO survey${c.spirometry ? ', ' + esc(c.spirometry[1]) : ''})</h3><ul style="list-style:none;padding:0;margin:10px 0 0;display:grid;gap:8px">${pol}</ul>` : ''}
    <a class="btn btn--orange" href="contact.html?country=${encodeURIComponent(c.name)}">Work with GALA Health in ${esc(c.name)}</a>
    <p style="margin-top:12px"><button class="atlas-tab" id="atlas-copy" type="button">Copy link to this profile</button> <span id="atlas-copied" class="lc-small" role="status"></span></p>`;
  $('#atlas-copy').onclick = () => navigator.clipboard.writeText(location.href.split('#')[0] + '#' + selected).then(() => $('#atlas-copied').textContent = 'Copied.', () => {});
}

function table() {
  const m = metric;
  const rows = Object.entries(DATA.countries).map(([a, c]) => [a, c, value(c, m.k)]).filter(r => r[2] != null)
    .sort((x, y) => sortDesc ? y[2] - x[2] : x[2] - y[2]);
  $('#atlas-table').innerHTML = `<thead><tr><th>Country</th><th class="num" id="atlas-sort" aria-sort="${sortDesc ? 'descending' : 'ascending'}">${esc(m.tab)} ${sortDesc ? '↓' : '↑'}</th><th class="num">Year</th></tr></thead>
    <tbody>${(showAll ? rows : rows.slice(0, 20)).map(([a, c, v]) => `<tr data-a="${esc(a)}"><td>${esc(c.name)}</td><td class="num">${esc(fmt(v, m))}</td><td class="num">${esc(year(c, m.k))}</td></tr>`).join('')}</tbody>`;
  $('#atlas-sort').onclick = () => { sortDesc = !sortDesc; table(); };
  $('#atlas-count').textContent = `${rows.length} countries with data`;
  const more = $('#atlas-more');
  more.hidden = rows.length <= 20;
  more.textContent = showAll ? 'Show top 20 only' : `Show all ${rows.length} countries`;
  more.onclick = () => { showAll = !showAll; table(); };
}

function select(a, scroll) {
  selected = a && DATA.countries[a] ? a : null;
  if (selected) history.replaceState(null, '', '#' + selected); else history.replaceState(null, '', location.pathname);
  drawMap(); profile();
  if (scroll && innerWidth < 900) $('#atlas-profile').scrollIntoView({behavior: 'smooth', block: 'start'});
}
function setMetric(k) {
  metric = METRICS.find(m => m.k === k);
  document.querySelectorAll('.atlas-tab[data-k]').forEach(b => b.setAttribute('aria-pressed', b.dataset.k === k));
  sortDesc = metric.kind !== 'good';
  drawMap(); table();
}

Promise.all([fetch('data/atlas.json').then(r => r.json()), fetch('data/world.json').then(r => r.json())]).then(([d, w]) => {
  DATA = d; WORLD = w;
  const avail = METRICS.filter(m => m.kind === 'score' ? READY.every(k => d.sources[k]) : d.sources[m.k]);
  $('#atlas-tabs').innerHTML = avail.map(m => `<button class="atlas-tab" data-k="${m.k}" aria-pressed="false" type="button">${esc(m.tab)}</button>`).join('');
  $('#atlas-tabs').onclick = e => { const b = e.target.closest('[data-k]'); if (b) setMetric(b.dataset.k); };
  $('#atlas-svg').onclick = e => { const p = e.target.closest('path'); if (p) select(p.dataset.a, true); };
  $('#atlas-table').onclick = e => { const r = e.target.closest('tr[data-a]'); if (r) { select(r.dataset.a); $('#atlas-top').scrollIntoView({behavior: 'smooth'}); } };
  // tooltip
  const tip = $('#atlas-tip'), map = $('.atlas-map');
  $('#atlas-svg').onmousemove = e => {
    const p = e.target.closest('path'); if (!p) { tip.hidden = true; return; }
    const c = DATA.countries[p.dataset.a], v = value(c, metric.k), rb = map.getBoundingClientRect();
    tip.hidden = false; tip.textContent = `${c ? c.name : p.dataset.a}: ${v == null ? 'no data' : fmt(v, metric)}`;
    tip.style.left = Math.min(e.clientX - rb.left + 12, rb.width - tip.offsetWidth - 8) + 'px'; tip.style.top = (e.clientY - rb.top + 12) + 'px';
  };
  $('#atlas-svg').onmouseleave = () => { tip.hidden = true; };
  // search
  const names = Object.entries(DATA.countries).filter(([a, c]) => WORLD.some(f => f.a === a) || c.spirometry).map(([a, c]) => [a, c.name]).sort((x, y) => x[1].localeCompare(y[1]));
  const inp = $('#atlas-q'), list = $('#atlas-results');
  inp.oninput = () => {
    const q = inp.value.trim().toLowerCase();
    const hits = q ? names.filter(([, n]) => n.toLowerCase().includes(q)).slice(0, 8) : [];
    list.hidden = !hits.length;
    list.innerHTML = hits.map(([a, n]) => `<li><button type="button" data-a="${esc(a)}">${esc(n)}</button></li>`).join('');
  };
  list.onclick = e => { const b = e.target.closest('button'); if (b) { select(b.dataset.a, true); inp.value = ''; list.hidden = true; } };
  inp.onkeydown = e => { if (e.key === 'Enter') { const b = list.querySelector('button'); if (b) b.click(); } if (e.key === 'Escape') list.hidden = true; };
  // sources
  $('#atlas-sources').innerHTML = 'Sources: ' + [...new Map(Object.values(d.sources).map(s => [s.source, s])).values()]
    .map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.source)}</a>`).join('; ') +
    `. Each figure shows the latest year available for that country. Data refreshed ${esc(d.generated)}. Country outlines: Natural Earth. Boundaries do not imply any opinion on the legal status of any territory.`;
  setMetric(avail[0].k);
  select(location.hash.slice(1).toUpperCase() || null);
  addEventListener('hashchange', () => select(location.hash.slice(1).toUpperCase() || null));
}).catch(() => { $('#atlas-profile').innerHTML = '<p>The atlas data could not be loaded. Please try again later.</p>'; });
}
