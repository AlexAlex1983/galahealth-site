/* ==========================================================================
   Hear Your Lungs — Lung Check
   - Answers stay in the visitor's browser; nothing is sent except the optional waitlist form.
   - Air quality: Open-Meteo Air Quality API (Copernicus CAMS model), free for non-profit sites
     without ads or subscriptions, CC BY 4.0. Called from the visitor's browser.
   - Waitlist: posts to SITE.formEndpoint (backend/forms.gs) with form=lungcheck.
   - Text: English below; other languages in assets/lungcheck-i18n.js, chosen by <html lang>.
     Scores (the numbers in Q) are shared by all languages.
   ========================================================================== */
{
const LANG = (document.documentElement.lang || 'en').slice(0, 2);
const LC = {
  pageUrl: 'https://galahealth.org/' + (LANG === 'en' ? 'lungcheck' : 'lungcheck-' + LANG),
  handle: '@GALA_Health',
  tag: '#HearYourLungs'
};

const EN = {
  q: [
    ['How old are you?', '', ['Under 35', '35–49', '50–64', '65 or older']],
    ['Do you smoke, or have you ever smoked regularly?', 'Cigarettes, cigars, pipes, shisha or hookah all count.', ['Never', 'Yes, but I quit', 'Yes, I smoke now']],
    ['Do you get out of breath walking quickly on flat ground or up a small hill?', '', ['No', 'Sometimes', 'Often']],
    ['Do you cough on most days, for several months of the year?', '', ['No', 'Yes']],
    ['Do you often cough up phlegm or mucus?', '', ['No', 'Yes']],
    ['In the past year, has your chest sounded wheezy or whistling?', '', ['No', 'Yes']],
    ['Has your breathing stopped you doing things you used to do?', '', ['No', 'A little', 'A lot']],
    ['At home, is food cooked or the house heated with wood, coal, charcoal, dung or kerosene?', '', ['No', 'Sometimes', 'Every day']],
    ['Have you worked for years around dust, fumes, smoke or chemicals?', 'For example mining, construction, farming, factories or cleaning.', ['No', 'Yes']],
    ['Have you ever been told you have asthma, or had many chest infections?', '', ['No', 'Yes']],
    ['In the past month, have you had any of these?', 'Coughing up blood · chest pain · severe breathlessness at rest · losing weight without trying', ['None of these', 'Yes, at least one']]
  ],
  bands: {
    low: ['Your answers suggest a lower risk of a long-term lung condition right now.',
      ['Stay smoke-free, and keep your home free of smoke from cooking and heating.', 'On high-pollution days, move hard exercise indoors or to cleaner hours.', 'Take this check again in a year, or sooner if your breathing changes.']],
    mod: ['Some of your answers are linked to a higher chance of lung problems.',
      ['Mention your breathing to a doctor or nurse at your next visit.', 'Ask whether a spirometry test is right for you. It is a simple, painless breathing test.', 'Cut your exposure to smoke, dust and polluted air where you can.']],
    high: ['Several of your answers match common signs of conditions such as COPD or asthma.',
      ['Book an appointment with a doctor or nurse in the next few weeks.', 'Ask for a spirometry breathing test. Early diagnosis makes treatment work better.', 'Show them this result and tell them about your symptoms and exposures.']]
  },
  aqi: [['Good', 'A good day to be active outdoors.'],
    ['Moderate', 'Most people can be active outdoors. If you have asthma or COPD, watch for symptoms during long or hard exercise.'],
    ['Unhealthy for sensitive groups', 'People with lung or heart disease, older adults and children should cut down on long or hard outdoor exercise.'],
    ['Unhealthy', 'Everyone should cut down on long or hard outdoor exercise. If you have a lung condition, stay indoors and keep windows closed.'],
    ['Very unhealthy', 'Avoid outdoor exercise. Stay indoors with windows closed. If you must go out, a well-fitted N95/FFP2 mask helps.'],
    ['Hazardous', 'Stay indoors with windows closed and avoid all outdoor exertion. If you must go out, wear a well-fitted N95/FFP2 mask.']],
  roles: ['Someone who cares about my lungs', 'Living with asthma or COPD', 'A caregiver', 'A doctor, nurse or health worker', 'From a health authority or NGO', 'A researcher or funder'],
  introTitle: 'Eleven quick questions, then the air where you live',
  introHint: 'Your answers stay on your device. Nothing is sent unless you join the waitlist at the end.',
  start: 'Start my lung check', step: 'Step {n} of {t}', back: 'Back',
  whereTitle: 'Where do you live?', whereHint: "We'll show today's air quality there. Your location is not stored.",
  cityPh: 'Town or city', find: 'Find', geo: 'Use my location', skip: 'Skip',
  searching: 'Searching…', noFound: 'No place found. Try another spelling, or skip.', choose: 'Choose your place:', checking: 'Checking the air…',
  geoNA: 'Location is not available here. Type your town instead.', geoAsk: 'Asking for your location…', geoDenied: 'Location was not shared. Type your town instead.',
  yourArea: 'your area', resultLabel: 'Your lung check', lower: 'Lower', some: 'Some risk', higher: 'Higher',
  smokerTip: 'Quitting is the single best thing you can do for your lungs. Ask your doctor or a local quit line for support.',
  fuelTip: 'Ventilate when cooking or heating, and ask about cleaner stoves or fuels.',
  notDx: 'This is not a diagnosis. If you have ongoing symptoms, see a doctor whatever your result.',
  redB: 'Please see a doctor soon.', red: 'Coughing up blood, chest pain, severe breathlessness at rest or unexplained weight loss need prompt medical attention. If symptoms are severe or sudden, call your local emergency number.',
  airTitle: 'Air in {p} now', airWhere: 'Air where you live', airSkip: 'You skipped this step. Check local air quality before outdoor exercise, especially on still, hazy or smoky days.',
  airErrTitle: 'Air in {p}', airErr: "We couldn't load live air-quality data just now, so we can't give advice for today. Please check a local air-quality service before outdoor exercise, or try again in a moment.",
  pm: 'Fine particles (PM2.5): {v}', pmOver: ', about {x}× the WHO 24-hour guideline', pmOk: ', within the WHO 24-hour guideline',
  model: 'Model estimate (Copernicus CAMS via Open-Meteo). Local monitoring stations may read differently.',
  shareTitle: 'Ask your friends to check too', shareText: 'Share the card. It shows you took the check and the air in your city, not your answers.',
  save: 'Save image', copy: 'Copy link', copied: 'Link copied.', saved: 'Image saved. Post it with {tag}', saveBlocked: 'Saving is blocked here. Take a screenshot of the card instead.',
  waitTitle: 'Coming soon: the breath test', waitText: "We're building an AI check that listens to your breathing through your phone's microphone. Join the waitlist to try it first.",
  email: 'Email', iam: 'I am', country: 'Country', donate: "I'd like to help train the breath test by donating a short breathing recording later.",
  consent: 'I agree that GALA Health may email me about the Lung Check and breath test. I can unsubscribe any time.', privacy: 'Privacy Policy',
  join: 'Join the waitlist', joined: "<b>You're on the list.</b> We'll email you when the breath test is ready to try.",
  badEmail: 'Please enter a valid email.', tick: 'Please tick the consent box to join.', notConnected: 'The waitlist is not connected yet. Please email info@galahealth.org.',
  error: 'Something went wrong. Please try again in a moment.', again: 'Take the check again',
  cardKicker: 'HEAR YOUR LUNGS', cardTitle: 'I checked my lungs today.', cardAir: 'Air in {p} right now: {l} (US AQI {n}).', cardAlt: 'Two minutes. Free. Anonymous.', cardCta: 'Check yours: ',
  shareMsg: 'I just took a free 2-minute lung health check from {h}. Check yours: {tag}'
};
const T = Object.assign({}, EN, (window.LC_I18N || {})[LANG] || {});
const tf = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k] ?? '');

// scores per answer, same order as T.q options
const SCORES = [[0, 1, 2, 3], [0, 2, 3], [0, 1, 2], [0, 2], [0, 1], [0, 2], [0, 1, 2], [0, 1, 2], [0, 1], [0, 1], [0, 0]];
const IDS = ['age', 'smoke', 'breath', 'cough', 'phlegm', 'wheeze', 'limit', 'fuel', 'work', 'hist', 'red'];
const SYM = ['breath', 'cough', 'phlegm', 'wheeze', 'limit'];
const Q = IDS.map((id, i) => ({id, t: T.q[i][0], h: T.q[i][1], o: T.q[i][2].map((label, k) => [label, SCORES[i][k]]), s: SYM.includes(id)}));
const TOTAL = Q.length + 1;

const root = document.getElementById('lung-check');
const st = {i: -1, a: {}, place: null, air: null};
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const BN = {low: 0, mod: 1, high: 2};

// US AQI categories (US EPA), used worldwide by air-quality apps
const AQI = [[50, '#2f8f57'], [100, '#a87d00'], [150, '#d26a12'], [200, '#c9372c'], [300, '#8a3a8f'], [1e9, '#7a1f2b']];
const aqiIdx = v => AQI.findIndex(r => v <= r[0]);

function prog(n) {
  return `<div class="lc-prog" aria-hidden="true"><i style="width:${Math.round(n / TOTAL * 100)}%"></i></div><p class="lc-step">${esc(tf(T.step, {n: Math.min(n + 1, TOTAL), t: TOTAL}))}</p>`;
}

function render() {
  const i = st.i;
  if (i < 0) {
    root.innerHTML = `<h2 class="lc-q">${esc(T.introTitle)}</h2>
      <p class="lc-hint">${esc(T.introHint)}</p>
      <div class="lc-nav"><button class="btn btn--orange" data-go="start">${esc(T.start)}</button></div>`;
  } else if (i < Q.length) {
    const q = Q[i], cur = st.a[q.id];
    root.innerHTML = prog(i) + `<h2 class="lc-q" tabindex="-1">${esc(q.t)}</h2>${q.h ? `<p class="lc-hint">${esc(q.h)}</p>` : ''}
      <div class="lc-opts">${q.o.map((o, k) => `<button class="lc-opt" data-k="${k}" aria-pressed="${cur === k}">${esc(o[0])}</button>`).join('')}</div>
      <div class="lc-nav"><button class="btn btn--ghost" data-go="back">${esc(T.back)}</button></div>`;
  } else if (i === Q.length) {
    root.innerHTML = prog(i) + `<h2 class="lc-q" tabindex="-1">${esc(T.whereTitle)}</h2>
      <p class="lc-hint">${esc(T.whereHint)}</p>
      <form class="lc-row" data-f="city"><input class="lc-in" id="lc-city" name="city" placeholder="${esc(T.cityPh)}" aria-label="${esc(T.cityPh)}" autocomplete="address-level2" required>
        <button class="btn" type="submit">${esc(T.find)}</button></form>
      <div class="lc-places"></div><p class="lc-msg" role="status"></p>
      <div class="lc-nav"><button class="btn btn--ghost" data-go="back">${esc(T.back)}</button>
        <span class="lc-row" style="margin:0"><button class="btn btn--ghost" data-go="geo">${esc(T.geo)}</button><button class="btn btn--ghost" data-go="skip">${esc(T.skip)}</button></span></div>`;
  } else {
    results();
  }
  const h = root.querySelector('.lc-q');
  if (h && i >= 0) h.focus({preventScroll: true});
}

function score() {
  let s = 0, sym = 0;
  Q.forEach(q => { const k = st.a[q.id]; if (k == null) return; const v = q.o[k][1]; s += v; if (q.s) sym += v; });
  let b = s >= 10 ? 'high' : s >= 5 ? 'mod' : 'low';
  if (b === 'low' && sym >= 4) b = 'mod';
  return {b, red: st.a.red === 1, smoker: st.a.smoke === 2, fuel: st.a.fuel > 0};
}

function placeName() { return st.place ? st.place.name : T.yourArea; }

function airCard() {
  const a = st.air;
  if (!a) return `<div class="lc-card"><h3>${esc(T.airWhere)}</h3><p>${esc(T.airSkip)}</p></div>`;
  if (a.error) return `<div class="lc-card"><h3>${esc(tf(T.airErrTitle, {p: placeName()}))}</h3><p>${esc(T.airErr)}</p></div>`;
  const i = aqiIdx(a.aqi), x = a.pm25 / 15;
  return `<div class="lc-card"><h3>${esc(tf(T.airTitle, {p: placeName()}))}</h3>
    <p class="lc-big">${Math.round(a.aqi)} <small>US AQI</small></p><span class="lc-chip" style="background:${AQI[i][1]}">${esc(T.aqi[i][0])}</span>
    <p style="margin-top:14px">${esc(tf(T.pm, {v: ''}))}<b style="white-space:nowrap">${a.pm25.toFixed(0)} µg/m³</b>${esc(x > 1.05 ? tf(T.pmOver, {x: x.toFixed(x >= 10 ? 0 : 1)}) : T.pmOk)}.</p>
    <p style="margin-top:10px">${esc(T.aqi[i][1])}</p>
    <p class="lc-small" style="margin-top:12px">${esc(T.model)}</p></div>`;
}

function results() {
  const r = score(), B = T.bands[r.b], n = BN[r.b];
  root.innerHTML = `<div class="lc-res">
    <div class="lc-band" data-b="${r.b}">
      <p class="lc-step">${esc(T.resultLabel)}</p>
      <h2 tabindex="-1" class="lc-q">${esc(B[0])}</h2>
      <div class="lc-meter" aria-hidden="true">${[0, 1, 2].map(k => `<span class="${k <= n ? 'on' : ''}"></span>`).join('')}</div>
      <div class="lc-mlab"><span>${esc(T.lower)}</span><span style="text-align:center">${esc(T.some)}</span><span style="text-align:right">${esc(T.higher)}</span></div>
      <ul>${B[1].map(d => `<li>${esc(d)}</li>`).join('')}${r.smoker ? `<li>${esc(T.smokerTip)}</li>` : ''}${r.fuel ? `<li>${esc(T.fuelTip)}</li>` : ''}</ul>
      <p class="lc-small" style="margin-top:14px">${esc(T.notDx)}</p>
    </div>
    ${r.red ? `<div class="lc-alert" role="alert"><b>${esc(T.redB)}</b> ${esc(T.red)}</div>` : ''}
    <div class="lc-cards">
      ${airCard()}
      <div class="lc-card"><h3>${esc(T.shareTitle)}</h3>
        <p>${esc(T.shareText)}</p>
        <canvas class="lc-canvas" width="1080" height="1080" aria-label="${esc(T.cardTitle)}"></canvas>
        <div class="lc-share">
          <button class="btn btn--orange" data-go="save">${esc(T.save)}</button>
          <a class="btn btn--ghost" target="_blank" rel="noopener" data-net="x">X</a>
          <a class="btn btn--ghost" target="_blank" rel="noopener" data-net="li">LinkedIn</a>
          <a class="btn btn--ghost" target="_blank" rel="noopener" data-net="wa">WhatsApp</a>
          <a class="btn btn--ghost" target="_blank" rel="noopener" data-net="tg">Telegram</a>
          <button class="btn btn--ghost" data-go="copy">${esc(T.copy)}</button>
        </div><p class="lc-small lc-sharemsg" role="status" style="margin-top:8px"></p>
      </div>
    </div>
    <div class="lc-card lc-wait">
      <h3>${esc(T.waitTitle)}</h3>
      <p style="margin-top:6px">${esc(T.waitText)}</p>
      <form class="lc-form" data-f="wait" novalidate>
        <label for="lc-email">${esc(T.email)}</label><input class="lc-in" id="lc-email" type="email" autocomplete="email" required>
        <label for="lc-role">${esc(T.iam)}</label>
        <select class="lc-in" id="lc-role">${EN.roles.map((r0, k) => `<option value="${esc(r0)}">${esc(T.roles[k])}</option>`).join('')}</select>
        <label for="lc-country">${esc(T.country)}</label><input class="lc-in" id="lc-country" autocomplete="country-name" value="${esc(st.place && st.place.country || '')}">
        <label class="lc-check"><input type="checkbox" id="lc-donate"><span>${esc(T.donate)}</span></label>
        <label class="lc-check"><input type="checkbox" id="lc-ok" required><span>${esc(T.consent)} <a href="https://galahealth.org/privacy.html#lung-check" target="_blank" rel="noopener">${esc(T.privacy)}</a></span></label>
        <input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">
        <button class="btn btn--orange" type="submit">${esc(T.join)}</button>
        <p class="lc-small lc-waitmsg" role="status"></p>
      </form>
    </div>
    <div class="lc-nav"><button class="btn btn--ghost" data-go="again">${esc(T.again)}</button></div>
  </div>`;
  const text = tf(T.shareMsg, {h: LC.handle, tag: LC.tag});
  const u = encodeURIComponent(LC.pageUrl), t = encodeURIComponent(text);
  const links = {x: `https://x.com/intent/tweet?text=${t}&url=${u}`, li: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    wa: `https://wa.me/?text=${t}%20${u}`, tg: `https://t.me/share/url?url=${u}&text=${t}`};
  root.querySelectorAll('[data-net]').forEach(a => { a.href = links[a.dataset.net]; });
  drawCard();
  root.querySelector('.lc-q').focus({preventScroll: true});
  root.scrollIntoView({behavior: 'smooth', block: 'start'});
}

function wrap(ctx, txt, x, y, w, lh) {
  let line = '';
  for (const wd of txt.split(' ')) {
    const tst = line ? line + ' ' + wd : wd;
    if (ctx.measureText(tst).width > w && line) { ctx.fillText(line, x, y); line = wd; y += lh; } else line = tst;
  }
  ctx.fillText(line, x, y);
  return y;
}

function loadImg(src) {
  return new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
}

async function drawCard() {
  const c = root.querySelector('.lc-canvas'); if (!c) return;
  try { await document.fonts.ready; } catch (e) {}
  const logo = typeof SITE !== 'undefined' ? await loadImg(SITE.logoFooter) : null;
  const x = c.getContext('2d'), F = 'Manrope, system-ui, sans-serif';
  x.fillStyle = '#152d53'; x.fillRect(0, 0, 1080, 1080);
  [460, 380, 300].forEach((r, k) => { x.beginPath(); x.arc(820, 300, r, 0, Math.PI * 2); x.fillStyle = `rgba(77,169,237,${0.07 + k * 0.05})`; x.fill(); });
  if (logo) { const k = logo.width / 1280; x.drawImage(logo, 150 * k, 295 * k, 990 * k, 390 * k, 80, 70, 330, 130); } // crop the padding around the footer logo
  else { x.fillStyle = '#fff'; x.font = `800 44px ${F}`; x.fillText('GALA Health', 80, 130); }
  x.fillStyle = '#f88623'; x.font = `700 36px ${F}`; x.fillText(T.cardKicker, 80, 280);
  x.fillStyle = '#fff'; x.font = `800 88px ${F}`;
  let y = wrap(x, T.cardTitle, 80, 390, 900, 98);
  x.font = `600 46px ${F}`; x.fillStyle = '#d5e1f0';
  const a = st.air;
  if (a && !a.error) y = wrap(x, tf(T.cardAir, {p: placeName(), l: T.aqi[aqiIdx(a.aqi)][0].toLowerCase(), n: Math.round(a.aqi)}), 80, y + 110, 900, 60);
  else y = wrap(x, T.cardAlt, 80, y + 110, 900, 60);
  x.fillStyle = '#f88623'; x.beginPath();
  if (x.roundRect) x.roundRect(80, 830, 920, 120, 60); else x.rect(80, 830, 920, 120);
  x.fill();
  const cta = T.cardCta + LC.pageUrl.replace(/^https?:\/\//, '');
  let fs = 50; do { x.font = `800 ${fs}px ${F}`; fs -= 2; } while (x.measureText(cta).width > 840 && fs > 24);
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.fillText(cta, 540, 907); x.textAlign = 'left';
  x.fillStyle = '#4da9ed'; x.font = `700 36px ${F}`; x.fillText(LC.tag, 80, 1030);
}

async function findCity(q) {
  const msg = root.querySelector('.lc-msg'), box = root.querySelector('.lc-places');
  msg.textContent = T.searching; box.innerHTML = '';
  try {
    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?count=5&language=${LANG}&format=json&name=${encodeURIComponent(q)}`);
    const j = await r.json();
    if (!j.results || !j.results.length) { msg.textContent = T.noFound; return; }
    msg.textContent = T.choose;
    st.found = j.results;
    box.innerHTML = j.results.map((p, k) => {
      const where = [p.admin1, p.country].filter(Boolean).join(', ');
      return `<button class="lc-opt" data-p="${k}">${esc(p.name)}${where ? ` <small>· ${esc(where)}</small>` : ''}</button>`;
    }).join('');
  } catch (e) {
    st.place = {name: q, country: ''};
    st.air = {error: true};
    st.i = Q.length + 1; render();
  }
}

async function getAir(lat, lon) {
  const msg = root.querySelector('.lc-msg'); if (msg) msg.textContent = T.checking;
  try {
    const r = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5&timezone=auto`);
    const c = (await r.json()).current;
    if (!c || c.us_aqi == null || c.pm2_5 == null) throw new Error('no data');
    st.air = {aqi: c.us_aqi, pm25: c.pm2_5};
  } catch (e) {
    st.air = {error: true};
  }
  st.i = Q.length + 1; render();
}

root.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || !root.contains(b)) return;
  if (b.dataset.k != null) {
    st.a[Q[st.i].id] = +b.dataset.k; b.setAttribute('aria-pressed', 'true');
    setTimeout(() => { st.i++; render(); }, 160); return;
  }
  if (b.dataset.p != null) {
    const p = st.found[+b.dataset.p];
    st.place = {name: p.name, country: p.country || ''};
    getAir(p.latitude, p.longitude); return;
  }
  const g = b.dataset.go; if (!g) return;
  if (g === 'start') { st.i = 0; render(); }
  else if (g === 'back') { st.i = Math.max(-1, st.i - 1); render(); }
  else if (g === 'skip') { st.air = null; st.place = null; st.i = Q.length + 1; render(); }
  else if (g === 'again') { st.i = -1; st.a = {}; st.air = null; st.place = null; render(); }
  else if (g === 'geo') {
    const msg = root.querySelector('.lc-msg');
    if (!navigator.geolocation) { msg.textContent = T.geoNA; return; }
    msg.textContent = T.geoAsk;
    navigator.geolocation.getCurrentPosition(
      p => { st.place = null; getAir(p.coords.latitude.toFixed(2), p.coords.longitude.toFixed(2)); },
      () => { msg.textContent = T.geoDenied; }, {timeout: 8000});
  }
  else if (g === 'save') {
    const c = root.querySelector('.lc-canvas'), m = root.querySelector('.lc-sharemsg');
    c.toBlob(async blob => {
      try {
        const f = new File([blob], 'my-lung-check.png', {type: 'image/png'});
        if (navigator.canShare && navigator.canShare({files: [f]})) { await navigator.share({files: [f], text: LC.tag + ' ' + LC.pageUrl}); return; }
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'my-lung-check.png';
        document.body.appendChild(a); a.click(); a.remove();
        m.textContent = tf(T.saved, {tag: LC.tag});
      } catch (err) { if (err && err.name !== 'AbortError') m.textContent = T.saveBlocked; }
    });
  }
  else if (g === 'copy') {
    const m = root.querySelector('.lc-sharemsg');
    navigator.clipboard.writeText(LC.pageUrl).then(() => m.textContent = T.copied, () => m.textContent = LC.pageUrl);
  }
});

root.addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target;
  if (f.dataset.f === 'city') { const v = f.city.value.trim(); if (v) findCity(v); return; }
  if (f.dataset.f !== 'wait') return;
  const m = f.querySelector('.lc-waitmsg'), email = f.querySelector('#lc-email').value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { m.textContent = T.badEmail; return; }
  if (!f.querySelector('#lc-ok').checked) { m.textContent = T.tick; return; }
  const endpoint = typeof SITE !== 'undefined' && SITE.formEndpoint;
  if (!endpoint) { m.textContent = T.notConnected; return; }
  const data = new URLSearchParams({form: 'lungcheck', email, role: f.querySelector('#lc-role').value,
    country: f.querySelector('#lc-country').value.trim(), donate: f.querySelector('#lc-donate').checked ? 'yes' : 'no',
    consent: 'yes', website: f.website.value, page: (location.pathname + location.search).slice(0, 200)});
  const btn = f.querySelector('button[type=submit]'); btn.disabled = true;
  try {
    await fetch(endpoint, {method: 'POST', mode: 'no-cors', body: data});
    f.innerHTML = `<p style="font-size:18px;color:#fff">${T.joined}</p>`;
  } catch (err) {
    m.textContent = T.error; btn.disabled = false;
  }
});

render();
}
