/* Home-page preview of the Lung Health Atlas: lung-care readiness map, each country links to its profile. */
{
const box = document.getElementById('atlas-mini'); if (box) {
const READY = ['spirometry', 'crd_guidelines', 'crd_plan', 'bronchodilators', 'steroid_inhalers'];
const BLUE = ['#f88623', '#f6a35c', '#f2c79a', '#bcdcf5', '#7fc0ef', '#4da9ed']; // orange = gaps, blue = ready
const A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796, M = Math.sqrt(3) / 2;
const proj = (lon, lat) => {
  const l = lon * Math.PI / 180, t = Math.asin(M * Math.sin(lat * Math.PI / 180)), t2 = t * t, t6 = t2 * t2 * t2;
  return [((l * Math.cos(t) / (M * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2)))) + 2.7066) * 180, (1.3173 - t * (A1 + A2 * t2 + t6 * (A3 + A4 * t2))) * 180];
};
const yes = v => typeof v === 'string' && /^(yes|generally available)/i.test(v);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
Promise.all([fetch('data/atlas.json').then(r => r.json()), fetch('data/world.json').then(r => r.json())]).then(([d, w]) => {
  const score = c => c && READY.every(k => c[k]) ? READY.filter(k => yes(c[k][0])).length : null;
  box.innerHTML = `<svg viewBox="0 0 975 480" role="img" aria-label="World map of lung-care readiness">${w.map(f => {
    const c = d.countries[f.a], s = score(c);
    const p = f.r.map(r => 'M' + r.map(([x, y]) => proj(x, y).map(n => n.toFixed(1)).join(',')).join('L') + 'Z').join('');
    return `<a href="atlas.html#${esc(f.a)}"><path d="${p}" fill="${s == null ? 'rgba(255,255,255,.18)' : BLUE[s]}" fill-rule="evenodd"><title>${esc(c ? c.name : f.n)}${s == null ? '' : `: ${s} of 5`}</title></path></a>`;
  }).join('')}</svg>
  <p class="atlas-mini-key"><span>Lung-care readiness:</span>${BLUE.map((c, i) => `<span><i style="background:${c}"></i>${i}</span>`).join('')}<span>of 5 WHO survey items</span></p>`;
}).catch(() => { box.closest('section').hidden = true; });
}
}
