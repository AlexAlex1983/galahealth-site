/* COPD investment case calculator — uses data/atlas.json (World Bank population and health spending). */
{
const $ = s => document.getElementById(s);
const nf = n => Math.round(n).toLocaleString('en');
const big = n => n >= 1e9 ? (n / 1e9).toFixed(1) + ' billion' : n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + ' million' : nf(n);
const usd = n => 'US$ ' + big(n);
let C = {};

function calc() {
  const pop = +$('c-pop').value || 0, prev = +$('c-prev').value / 100, undx = +$('c-undx').value / 100,
        yld = +$('c-yield').value / 100, share = +$('c-share').value / 100, cost = +$('c-cost').value || 0;
  $('o-prev').textContent = (+$('c-prev').value).toFixed(1) + '%';
  $('o-undx').textContent = $('c-undx').value + '%';
  $('o-yield').textContent = `${$('c-yield').value}% (1 in ${Math.round(100 / $('c-yield').value)})`;
  $('o-share').textContent = $('c-share').value + '%';
  const cases = pop * prev, missing = cases * undx, target = missing * share, tests = target / yld, total = tests * cost;
  $('r-cases').textContent = big(cases);
  $('r-undx').textContent = big(missing);
  $('r-target').textContent = big(target);
  $('r-tests').textContent = big(tests);
  $('r-tests-yr').textContent = big(tests / 5);
  $('r-cost').textContent = usd(total);
  $('r-per').textContent = 'US$ ' + nf(cost / yld);
  const c = C[$('c-country').value];
  let ctx = '';
  if (c && c.che_pc && c.population) {
    const che = c.che_pc[0] * c.population[0];
    ctx = `For scale: ${c.name} spends about ${usd(che)} a year on health (US$ ${nf(c.che_pc[0])} per person, World Bank ${c.che_pc[1]}). This programme would cost about ${(total / 5 / che * 100).toFixed(total / 5 / che * 100 < 0.1 ? 3 : 2)}% of that each year.`;
  }
  $('r-ctx').textContent = ctx;
  $('r-title').textContent = c ? c.name : 'Results';
  return {c, cases, missing, target, tests, total, cost, yld};
}

fetch('data/atlas.json').then(r => r.json()).then(d => {
  C = d.countries;
  const list = Object.entries(C).filter(([, c]) => c.pop_30_79).sort((a, b) => a[1].name.localeCompare(b[1].name));
  $('c-country').innerHTML = list.map(([a, c]) => `<option value="${a}">${c.name.replace(/[<&]/g, '')}</option>`).join('');
  const want = (location.hash.slice(1) || 'KEN').toUpperCase();
  $('c-country').value = C[want] && C[want].pop_30_79 ? want : list[0][0];
  const pick = () => {
    const c = C[$('c-country').value];
    $('c-pop').value = c.pop_30_79[0];
    $('c-pop-src').textContent = `World Bank (UN population estimates), ${c.pop_30_79[1]}. You can type your own figure.`;
    history.replaceState(null, '', '#' + $('c-country').value);
    calc();
  };
  $('c-country').onchange = pick;
  $('calc-form').oninput = e => { if (e.target.id !== 'c-country') calc(); };
  pick();
  $('r-copy').onclick = () => {
    const r = calc();
    const t = `${r.c ? r.c.name : 'Country'}: about ${big(r.cases)} people aged 30–79 live with COPD and ${big(r.missing)} are not yet diagnosed. Finding ${big(r.target)} of them in 5 years means testing about ${big(r.tests)} people, at roughly ${usd(r.total)} (US$ ${nf(r.cost / r.yld)} per new diagnosis). Source: GALA Health calculator, ${location.href}`;
    navigator.clipboard.writeText(t).then(() => $('r-msg').textContent = 'Summary copied.', () => $('r-msg').textContent = t);
  };
}).catch(() => { $('r-title').textContent = 'The data could not be loaded. Please try again later.'; });
}
