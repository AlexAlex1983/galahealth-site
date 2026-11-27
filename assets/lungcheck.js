/* ==========================================================================
   Hear Your Lungs — Lung Check
   - Answers stay in the visitor's browser; nothing is sent except the optional waitlist form.
   - Air quality: Open-Meteo Air Quality API (Copernicus CAMS model), free for non-profit sites
     without ads or subscriptions, CC BY 4.0. Called from the visitor's browser.
   - Waitlist: posts to SITE.formEndpoint (backend/forms.gs) with form=lungcheck.
   ========================================================================== */
{
const LC = {
  pageUrl: 'https://galahealth.org/lungcheck',
  handle: '@GALA_Health',
  tag: '#HearYourLungs'
};

const Q = [
  {id:'age', t:'How old are you?', o:[['Under 35',0],['35–49',1],['50–64',2],['65 or older',3]]},
  {id:'smoke', t:'Do you smoke, or have you ever smoked regularly?', h:'Cigarettes, cigars, pipes, shisha or hookah all count.', o:[['Never',0],['Yes, but I quit',2],['Yes, I smoke now',3]]},
  {id:'breath', t:'Do you get out of breath walking quickly on flat ground or up a small hill?', o:[['No',0],['Sometimes',1],['Often',2]], s:1},
  {id:'cough', t:'Do you cough on most days, for several months of the year?', o:[['No',0],['Yes',2]], s:1},
  {id:'phlegm', t:'Do you often cough up phlegm or mucus?', o:[['No',0],['Yes',1]], s:1},
  {id:'wheeze', t:'In the past year, has your chest sounded wheezy or whistling?', o:[['No',0],['Yes',2]], s:1},
  {id:'limit', t:'Has your breathing stopped you doing things you used to do?', o:[['No',0],['A little',1],['A lot',2]], s:1},
  {id:'fuel', t:'At home, is food cooked or the house heated with wood, coal, charcoal, dung or kerosene?', o:[['No',0],['Sometimes',1],['Every day',2]]},
  {id:'work', t:'Have you worked for years around dust, fumes, smoke or chemicals?', h:'For example mining, construction, farming, factories or cleaning.', o:[['No',0],['Yes',1]]},
  {id:'hist', t:'Have you ever been told you have asthma, or had many chest infections?', o:[['No',0],['Yes',1]]},
  {id:'red', t:'In the past month, have you had any of these?', h:'Coughing up blood · chest pain · severe breathlessness at rest · losing weight without trying', o:[['None of these',0],['Yes, at least one',0]]}
];
const TOTAL = Q.length + 1;

const root = document.getElementById('lung-check');
const st = {i:-1, a:{}, place:null, air:null};
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const BANDS = {
  low: {n:0, t:'Your answers suggest a lower risk of a long-term lung condition right now.',
        do:['Stay smoke-free, and keep your home free of smoke from cooking and heating.','On high-pollution days, move hard exercise indoors or to cleaner hours.','Take this check again in a year, or sooner if your breathing changes.']},
  mod: {n:1, t:'Some of your answers are linked to a higher chance of lung problems.',
        do:['Mention your breathing to a doctor or nurse at your next visit.','Ask whether a spirometry test is right for you. It is a simple, painless breathing test.','Cut your exposure to smoke, dust and polluted air where you can.']},
  high:{n:2, t:'Several of your answers match common signs of conditions such as COPD or asthma.',
        do:['Book an appointment with a doctor or nurse in the next few weeks.','Ask for a spirometry breathing test. Early diagnosis makes treatment work better.','Show them this result and tell them about your symptoms and exposures.']}
};

// US AQI categories (US EPA), used worldwide by air-quality apps
const AQI = [
  [50,  'Good', '#2f8f57', 'A good day to be active outdoors.'],
  [100, 'Moderate', '#a87d00', 'Most people can be active outdoors. If you have asthma or COPD, watch for symptoms during long or hard exercise.'],
  [150, 'Unhealthy for sensitive groups', '#d26a12', 'People with lung or heart disease, older adults and children should cut down on long or hard outdoor exercise.'],
  [200, 'Unhealthy', '#c9372c', 'Everyone should cut down on long or hard outdoor exercise. If you have a lung condition, stay indoors and keep windows closed.'],
  [300, 'Very unhealthy', '#8a3a8f', 'Avoid outdoor exercise. Stay indoors with windows closed. If you must go out, a well-fitted N95/FFP2 mask helps.'],
  [1e9, 'Hazardous', '#7a1f2b', 'Stay indoors with windows closed and avoid all outdoor exertion. If you must go out, wear a well-fitted N95/FFP2 mask.']
];
const aqiInfo = v => AQI.find(r => v <= r[0]);

function prog(n) {
  return `<div class="lc-prog" aria-hidden="true"><i style="width:${Math.round(n / TOTAL * 100)}%"></i></div><p class="lc-step">Step ${Math.min(n + 1, TOTAL)} of ${TOTAL}</p>`;
}

function render() {
  const i = st.i;
  if (i < 0) {
    root.innerHTML = `<h2 class="lc-q">Eleven quick questions, then the air where you live</h2>
      <p class="lc-hint">Your answers stay on your device. Nothing is sent unless you join the waitlist at the end.</p>
      <div class="lc-nav"><button class="btn btn--orange" data-go="start">Start my lung check</button></div>`;
  } else if (i < Q.length) {
    const q = Q[i], cur = st.a[q.id];
    root.innerHTML = prog(i) + `<h2 class="lc-q" tabindex="-1">${esc(q.t)}</h2>${q.h ? `<p class="lc-hint">${esc(q.h)}</p>` : ''}
      <div class="lc-opts">${q.o.map((o, k) => `<button class="lc-opt" data-k="${k}" aria-pressed="${cur === k}">${esc(o[0])}</button>`).join('')}</div>
      <div class="lc-nav"><button class="btn btn--ghost" data-go="back">Back</button></div>`;
  } else if (i === Q.length) {
    root.innerHTML = prog(i) + `<h2 class="lc-q" tabindex="-1">Where do you live?</h2>
      <p class="lc-hint">We'll show today's air quality there. Your location is not stored.</p>
      <form class="lc-row" data-f="city"><input class="lc-in" id="lc-city" name="city" placeholder="Town or city" autocomplete="address-level2" required>
        <button class="btn" type="submit">Find</button></form>
      <div class="lc-places"></div><p class="lc-msg" role="status"></p>
      <div class="lc-nav"><button class="btn btn--ghost" data-go="back">Back</button>
        <span class="lc-row" style="margin:0"><button class="btn btn--ghost" data-go="geo">Use my location</button><button class="btn btn--ghost" data-go="skip">Skip</button></span></div>`;
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

function airCard() {
  const a = st.air, p = st.place;
  if (!a) return `<div class="lc-card"><h3>Air where you live</h3><p>You skipped this step. Check local air quality before outdoor exercise, especially on still, hazy or smoky days.</p></div>`;
  if (a.error) return `<div class="lc-card"><h3>Air in ${esc(p ? p.name : 'your area')}</h3><p>We couldn't load live air-quality data just now, so we can't give advice for today. Please check a local air-quality service before outdoor exercise, or try again in a moment.</p></div>`;
  const inf = aqiInfo(a.aqi), x = a.pm25 / 15;
  return `<div class="lc-card"><h3>Air in ${esc(p ? p.name : 'your area')} now</h3>
    <p class="lc-big">${Math.round(a.aqi)} <small>US AQI</small></p><span class="lc-chip" style="background:${inf[2]}">${inf[1]}</span>
    <p style="margin-top:14px">Fine particles (PM2.5): <b style="white-space:nowrap">${a.pm25.toFixed(0)} µg/m³</b>${x > 1.05 ? `, about <b>${x.toFixed(x >= 10 ? 0 : 1)}×</b> the WHO 24-hour guideline` : ', within the WHO 24-hour guideline'}.</p>
    <p style="margin-top:10px">${inf[3]}</p>
    <p class="lc-small" style="margin-top:12px">Model estimate (Copernicus CAMS via Open-Meteo). Local monitoring stations may read differently.</p></div>`;
}

function results() {
  const r = score(), B = BANDS[r.b];
  root.innerHTML = `<div class="lc-res">
    <div class="lc-band" data-b="${r.b}">
      <p class="lc-step">Your lung check</p>
      <h2 tabindex="-1" class="lc-q">${esc(B.t)}</h2>
      <div class="lc-meter" aria-hidden="true">${[0, 1, 2].map(n => `<span class="${n <= B.n ? 'on' : ''}"></span>`).join('')}</div>
      <div class="lc-mlab"><span>Lower</span><span style="text-align:center">Some risk</span><span style="text-align:right">Higher</span></div>
      <ul>${B.do.map(d => `<li>${esc(d)}</li>`).join('')}${r.smoker ? '<li>Quitting is the single best thing you can do for your lungs. Ask your doctor or a local quit line for support.</li>' : ''}${r.fuel ? '<li>Ventilate when cooking or heating, and ask about cleaner stoves or fuels.</li>' : ''}</ul>
      <p class="lc-small" style="margin-top:14px">This is not a diagnosis. If you have ongoing symptoms, see a doctor whatever your result.</p>
    </div>
    ${r.red ? `<div class="lc-alert" role="alert"><b>Please see a doctor soon.</b> Coughing up blood, chest pain, severe breathlessness at rest or unexplained weight loss need prompt medical attention. If symptoms are severe or sudden, call your local emergency number.</div>` : ''}
    <div class="lc-cards">
      ${airCard()}
      <div class="lc-card"><h3>Ask your friends to check too</h3>
        <p>Share the card. It shows you took the check and the air in your city, not your answers.</p>
        <canvas class="lc-canvas" width="1080" height="1080" aria-label="Share card"></canvas>
        <div class="lc-share">
          <button class="btn btn--orange" data-go="save">Save image</button>
          <a class="btn btn--ghost" target="_blank" rel="noopener" data-net="x">X</a>
          <a class="btn btn--ghost" target="_blank" rel="noopener" data-net="li">LinkedIn</a>
          <a class="btn btn--ghost" target="_blank" rel="noopener" data-net="wa">WhatsApp</a>
          <a class="btn btn--ghost" target="_blank" rel="noopener" data-net="tg">Telegram</a>
          <button class="btn btn--ghost" data-go="copy">Copy link</button>
        </div><p class="lc-small lc-sharemsg" role="status" style="margin-top:8px"></p>
      </div>
    </div>
    <div class="lc-card lc-wait">
      <h3>Coming soon: the breath test</h3>
      <p style="margin-top:6px">We're building an AI check that listens to your breathing through your phone's microphone. Join the waitlist to try it first.</p>
      <form class="lc-form" data-f="wait" novalidate>
        <label for="lc-email">Email</label><input class="lc-in" id="lc-email" type="email" autocomplete="email" required>
        <label for="lc-role">I am</label>
        <select class="lc-in" id="lc-role"><option>Someone who cares about my lungs</option><option>Living with asthma or COPD</option><option>A caregiver</option><option>A doctor, nurse or health worker</option><option>From a health authority or NGO</option><option>A researcher or funder</option></select>
        <label for="lc-country">Country</label><input class="lc-in" id="lc-country" autocomplete="country-name" value="${esc(st.place && st.place.country || '')}">
        <label class="lc-check"><input type="checkbox" id="lc-donate"><span>I'd like to help train the breath test by donating a short breathing recording later.</span></label>
        <label class="lc-check"><input type="checkbox" id="lc-ok" required><span>I agree that GALA Health may email me about the Lung Check and breath test. I can unsubscribe any time. <a href="privacy.html#lung-check">Privacy Policy</a></span></label>
        <input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">
        <button class="btn btn--orange" type="submit">Join the waitlist</button>
        <p class="lc-small lc-waitmsg" role="status"></p>
      </form>
    </div>
    <div class="lc-nav"><button class="btn btn--ghost" data-go="again">Take the check again</button></div>
  </div>`;
  const text = `I just took a free 2-minute lung health check from ${LC.handle}. Check yours: ${LC.tag}`;
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
  x.fillStyle = '#f88623'; x.font = `700 36px ${F}`; x.fillText('HEAR YOUR LUNGS', 80, 280);
  x.fillStyle = '#fff'; x.font = `800 92px ${F}`;
  let y = wrap(x, 'I checked my lungs today.', 80, 390, 900, 100);
  x.font = `600 46px ${F}`; x.fillStyle = '#d5e1f0';
  const a = st.air;
  if (a && !a.error) y = wrap(x, `Air in ${st.place ? st.place.name : 'my area'} right now: ${aqiInfo(a.aqi)[1].toLowerCase()} (US AQI ${Math.round(a.aqi)}).`, 80, y + 110, 900, 60);
  else y = wrap(x, 'Two minutes. Free. Anonymous.', 80, y + 110, 900, 60);
  x.fillStyle = '#f88623'; x.beginPath();
  if (x.roundRect) x.roundRect(80, 830, 920, 120, 60); else x.rect(80, 830, 920, 120);
  x.fill();
  const cta = 'Check yours: ' + LC.pageUrl.replace(/^https?:\/\//, '');
  let fs = 50; do { x.font = `800 ${fs}px ${F}`; fs -= 2; } while (x.measureText(cta).width > 840 && fs > 24);
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.fillText(cta, 540, 907); x.textAlign = 'left';
  x.fillStyle = '#4da9ed'; x.font = `700 36px ${F}`; x.fillText(LC.tag, 80, 1030);
}

async function findCity(q) {
  const msg = root.querySelector('.lc-msg'), box = root.querySelector('.lc-places');
  msg.textContent = 'Searching…'; box.innerHTML = '';
  try {
    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?count=5&language=en&format=json&name=${encodeURIComponent(q)}`);
    const j = await r.json();
    if (!j.results || !j.results.length) { msg.textContent = 'No place found. Try another spelling, or skip.'; return; }
    msg.textContent = 'Choose your place:';
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
  const msg = root.querySelector('.lc-msg'); if (msg) msg.textContent = 'Checking the air…';
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
    if (!navigator.geolocation) { msg.textContent = 'Location is not available here. Type your town instead.'; return; }
    msg.textContent = 'Asking for your location…';
    navigator.geolocation.getCurrentPosition(
      p => { st.place = {name: 'your area', country: ''}; getAir(p.coords.latitude.toFixed(2), p.coords.longitude.toFixed(2)); },
      () => { msg.textContent = 'Location was not shared. Type your town instead.'; }, {timeout: 8000});
  }
  else if (g === 'save') {
    const c = root.querySelector('.lc-canvas'), m = root.querySelector('.lc-sharemsg');
    c.toBlob(async blob => {
      try {
        const f = new File([blob], 'my-lung-check.png', {type: 'image/png'});
        if (navigator.canShare && navigator.canShare({files: [f]})) { await navigator.share({files: [f], text: LC.tag + ' ' + LC.pageUrl}); return; }
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'my-lung-check.png';
        document.body.appendChild(a); a.click(); a.remove();
        m.textContent = 'Image saved. Post it with ' + LC.tag;
      } catch (err) { if (err && err.name !== 'AbortError') m.textContent = 'Saving is blocked here. Take a screenshot of the card instead.'; }
    });
  }
  else if (g === 'copy') {
    const m = root.querySelector('.lc-sharemsg');
    navigator.clipboard.writeText(LC.pageUrl).then(() => m.textContent = 'Link copied.', () => m.textContent = LC.pageUrl);
  }
});

root.addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target;
  if (f.dataset.f === 'city') { const v = f.city.value.trim(); if (v) findCity(v); return; }
  if (f.dataset.f !== 'wait') return;
  const m = f.querySelector('.lc-waitmsg'), email = f.querySelector('#lc-email').value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { m.textContent = 'Please enter a valid email.'; return; }
  if (!f.querySelector('#lc-ok').checked) { m.textContent = 'Please tick the consent box to join.'; return; }
  const endpoint = typeof SITE !== 'undefined' && SITE.formEndpoint;
  if (!endpoint) { m.textContent = 'The waitlist is not connected yet. Please email info@galahealth.org.'; return; }
  const data = new URLSearchParams({form: 'lungcheck', email, role: f.querySelector('#lc-role').value,
    country: f.querySelector('#lc-country').value.trim(), donate: f.querySelector('#lc-donate').checked ? 'yes' : 'no',
    consent: 'yes', website: f.website.value, page: location.pathname});
  const btn = f.querySelector('button[type=submit]'); btn.disabled = true;
  try {
    await fetch(endpoint, {method: 'POST', mode: 'no-cors', body: data});
    f.innerHTML = '<p style="font-size:18px;color:#fff"><b>You\'re on the list.</b> We\'ll email you when the breath test is ready to try.</p>';
  } catch (err) {
    m.textContent = 'Something went wrong. Please try again in a moment.'; btn.disabled = false;
  }
});

render();
}
