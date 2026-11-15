/* ==========================================================================
   Respiratory Health Calendar — rendering. Content lives in data/events.js.
   Renders (when the placeholder exists on the page):
     - a site-wide announcement bar when a day is ≤ 10 days away
     - #upcoming-events : next 3 days (Home page)
     - #calendar        : the full 12-month calendar (Campaigns page)
   ========================================================================== */
(function () {
  const EVENTS = window.GALA_EVENTS || [];
  if (!EVENTS.length) return;

  const WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const DAY = 86400000;

  function occurrence(ev, year) {
    const d = ev.date, m = d.month - 1;
    if (d.wholeMonth) return { start: new Date(year, m, 1), end: new Date(year, m + 1, 0) };
    if (d.day) { const x = new Date(year, m, d.day); return { start: x, end: x }; }
    let x;
    if (d.nth > 0) {
      x = new Date(year, m, 1);
      x.setDate(1 + ((WD[d.weekday] - x.getDay() + 7) % 7) + (d.nth - 1) * 7);
    } else {
      x = new Date(year, m + 1, 0);
      x.setDate(x.getDate() - ((x.getDay() - WD[d.weekday] + 7) % 7));
    }
    return { start: x, end: x };
  }

  // Next occurrence that has not finished yet
  const items = EVENTS.map((ev) => {
    let y = today.getFullYear(), o = occurrence(ev, y);
    if (o.end < today) o = occurrence(ev, ++y);
    const days = Math.round((o.start - today) / DAY);
    const status = o.start <= today ? (ev.date.wholeMonth ? "ongoing" : "today") : "upcoming";
    return { ...ev, ...o, year: y, days, status, theme: (ev.themes || {})[y] || "" };
  }).sort((a, b) => a.start - b.start || (a.date.wholeMonth ? 1 : -1));

  const fmt = (d, opts) => d.toLocaleDateString("en-GB", opts);
  const when = (e) => e.date.wholeMonth
    ? `All of ${MONTHS[e.start.getMonth()]} ${e.year}`
    : fmt(e.start, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const countdown = (e) => e.status === "today" ? "Today"
    : e.status === "ongoing" ? "Happening now"
    : e.days === 1 ? "Tomorrow"
    : e.days < 60 ? `In ${e.days} days`
    : `In ${Math.round(e.days / 30)} months`;
  const pageUrl = (e) => new URL(`campaigns.html#${e.id}`, location.href).href;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function shareLinks(e) {
    const url = pageUrl(e);
    const text = `${e.name}${e.theme ? ` – ${e.theme}` : ""}. ${e.message}`;
    const x = `https://x.com/intent/post?text=${encodeURIComponent(text.slice(0, 200) + (text.length > 200 ? "…" : ""))}&url=${encodeURIComponent(url)}&hashtags=${encodeURIComponent(e.hashtags.join(","))}`;
    const li = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    return { x, li };
  }

  function ics(e) {
    const d = (x) => `${x.getFullYear()}${String(x.getMonth() + 1).padStart(2, "0")}${String(x.getDate()).padStart(2, "0")}`;
    const endExcl = new Date(e.end.getTime() + DAY);
    const body = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//GALA Health//Respiratory Health Calendar//EN",
      "BEGIN:VEVENT", `UID:${e.id}-${e.year}@galahealth.org`, `DTSTAMP:${d(today)}T000000Z`,
      `DTSTART;VALUE=DATE:${d(e.start)}`, `DTEND;VALUE=DATE:${d(endExcl)}`,
      `SUMMARY:${e.name}`, `DESCRIPTION:${(e.theme ? `Theme: ${e.theme}\\n\\n` : "") + e.message.replace(/,/g, "\\,")}\\n\\n${pageUrl(e)}`,
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    return "data:text/calendar;charset=utf-8," + encodeURIComponent(body);
  }

  function badge(e) {
    return e.date.wholeMonth
      ? `<div class="ev-badge ev-badge--month"><span>${MONTHS[e.start.getMonth()].slice(0, 3)}</span><small>month</small></div>`
      : `<div class="ev-badge"><span>${e.start.getDate()}</span><small>${MONTHS[e.start.getMonth()].slice(0, 3)}</small></div>`;
  }

  function card(e, full) {
    const s = shareLinks(e);
    return `
      <article class="ev-card ev-card--${e.color || "cream"}${e.status !== "upcoming" || e.days <= 10 ? " is-live" : ""}" id="${full ? e.id : ""}">
        ${badge(e)}
        <div class="ev-body">
          <p class="ev-when"><span class="ev-count">${countdown(e)}</span> · ${when(e)}</p>
          <h3 class="ev-name">${esc(e.name)}</h3>
          ${e.theme ? `<p class="ev-theme">Theme: “${esc(e.theme)}”</p>` : e.organiser ? `<p class="ev-theme">Theme to be announced by ${esc(e.organiser)}</p>` : ""}
          ${full ? `<p class="ev-msg">${esc(e.message)}</p>
          <p class="ev-tags">${e.hashtags.map((h) => `#${h}`).join(" ")}</p>
          <div class="ev-actions">
            ${e.link ? `<a class="ev-btn" href="${e.link}" target="_blank" rel="noopener">Official campaign ↗</a>` : ""}
            <a class="ev-btn" href="${s.x}" target="_blank" rel="noopener">Share on X</a>
            <a class="ev-btn" href="${s.li}" target="_blank" rel="noopener">Share on LinkedIn</a>
            <a class="ev-btn ev-btn--ghost" href="${ics(e)}" download="${e.id}-${e.year}.ics">Add to calendar</a>
          </div>` : `<a class="ev-more" href="campaigns.html#${e.id}">Our message &amp; share kit →</a>`}
        </div>
      </article>`;
  }

  // 1. Announcement bar (single-day events within 10 days, or today)
  const soon = items.find((e) => !e.date.wholeMonth && e.days >= 0 && e.days <= 10);
  const header = document.querySelector(".site-header");
  if (soon && header) {
    const bar = document.createElement("a");
    bar.className = "event-bar";
    bar.href = `campaigns.html#${soon.id}`;
    bar.innerHTML = `<span class="dot"></span><strong>${soon.status === "today" ? `Today is ${esc(soon.name)}` : `${esc(soon.name)} · ${fmt(soon.start, { weekday: "long", day: "numeric", month: "long" })}`}</strong>${soon.theme ? `<span class="theme"> — ${esc(soon.theme)}</span>` : ""}<span class="cta">Join the campaign →</span>`;
    header.parentNode.insertBefore(bar, header);
  }

  // 2. Home: next three
  const up = document.getElementById("upcoming-events");
  if (up) up.innerHTML = items.slice(0, 3).map((e) => card(e, false)).join("");

  // 3. Campaigns page: full calendar grouped by month
  const cal = document.getElementById("calendar");
  if (cal) {
    let html = "", last = "";
    items.forEach((e) => {
      const key = `${MONTHS[e.start.getMonth()]} ${e.year}`;
      if (key !== last) { html += `<h2 class="ev-month">${key}</h2>`; last = key; }
      html += card(e, true);
    });
    cal.innerHTML = html;
    if (location.hash) {
      const t = document.querySelector(location.hash);
      if (t) { t.classList.add("is-target"); setTimeout(() => t.scrollIntoView({ block: "center" }), 50); }
    }
  }
})();
