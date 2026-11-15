/* ==========================================================================
   News & Publications — rendering. Content lives in:
     data/news.json          [{ title, date: "YYYY-MM-DD", summary, body, slug?, image? }]
     data/publications.json  [{ title, type, date, file }]
   Article pages: article.html?p=<slug>  (slug is made from the title if not given)
   ========================================================================== */
(function () {
  const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const slugify = (t) => String(t).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
  // Minimal, safe formatting for article bodies: blank line = new paragraph,
  // "## Heading", "- list item", **bold**, [link text](https://...)
  const inline = (t) => esc(t)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|[a-z0-9._\/-]+\.html[^)\s]*)\)/gi, '<a href="$2">$1</a>');
  const md = (body) => body.split("\n\n").map((block) => {
    if (block.startsWith("## ")) return `<h2>${inline(block.slice(3))}</h2>`;
    const lines = block.split("\n");
    if (lines.every((l) => l.startsWith("- "))) return `<ul>${lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join("")}</ul>`;
    return `<p>${inline(block)}</p>`;
  }).join("");
  const fmt = (d) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const v = (document.querySelector('script[src*="news.js"]')?.src.split("?v=")[1]) || Date.now();
  const getJSON = (f) => fetch(`data/${f}?v=${v}`).then((r) => r.json());

  const card = (n) => `
    <a class="news-card" href="article.html?p=${encodeURIComponent(n.slug)}">
      ${n.image ? `<img class="news-img" src="${esc(n.image)}" alt="">` : ""}
      <span class="news-date">${fmt(n.date)}</span>
      <h3 class="t-h4">${esc(n.title)}</h3>
      <p class="t-body">${esc(n.summary)}</p>
      <span class="news-more">Read article →</span>
    </a>`;

  const needNews = document.getElementById("latest-news") || document.getElementById("news-list") || document.getElementById("article");
  if (needNews) {
    getJSON("news.json").then((items) => {
      items.forEach((n) => (n.slug = n.slug || slugify(n.title)));
      items.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Home: latest three
      const latest = document.getElementById("latest-news");
      if (latest && items.length) {
        latest.innerHTML = items.slice(0, 3).map(card).join("");
        document.getElementById("latest-news-section").hidden = false;
      }

      // News page: featured latest + list
      const list = document.getElementById("news-list");
      if (list) {
        if (!items.length) { list.innerHTML = '<p class="t-body">News is coming soon.</p>'; }
        else {
          const [first, ...rest] = items;
          document.getElementById("news-featured").innerHTML = `
            <a class="news-feature" href="article.html?p=${encodeURIComponent(first.slug)}">
              <span class="pill">Latest</span>
              <span class="news-date">${fmt(first.date)}</span>
              <h2 class="t-h1">${esc(first.title)}</h2>
              <p class="t-lead measure" style="font-weight:400">${esc(first.summary)}</p>
              <span class="btn">Read article</span>
            </a>`;
          list.innerHTML = rest.length ? rest.map(card).join("") : "";
          if (!rest.length) list.closest("section").hidden = true;
        }
      }

      // Article page
      const art = document.getElementById("article");
      if (art) {
        const slug = new URLSearchParams(location.search).get("p");
        const i = items.findIndex((n) => n.slug === slug);
        const n = items[i];
        if (!n) { art.innerHTML = '<h1 class="t-hero">Article not found</h1><p class="t-body" style="margin-top:20px"><a class="btn" href="news.html">All news</a></p>'; return; }
        document.title = `${n.title} — GALA Health`;
        document.querySelector('meta[name="description"]')?.setAttribute("content", n.summary);
        const url = location.href;
        const x = `https://x.com/intent/post?text=${encodeURIComponent(n.title)}&url=${encodeURIComponent(url)}&via=GALA_Health`;
        const li = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        const next = items[i + 1];
        art.innerHTML = `
          <a class="back" href="news.html">← All news</a>
          <p class="news-date" style="margin-top:28px">${fmt(n.date)}</p>
          <h1 class="t-hero" style="margin-top:10px">${esc(n.title)}</h1>
          <p class="t-lead" style="font-weight:400;margin-top:24px;color:#333">${esc(n.summary)}</p>
          ${n.image ? `<figure class="photo article-img-wrap"><img class="article-img" src="${esc(n.image)}" alt="">${n.imageCredit ? `<figcaption class="credit">${esc(n.imageCredit)}</figcaption>` : ""}</figure>` : ""}
          <div class="article-body">${md(n.body)}</div>
          <div class="ev-actions" style="margin-top:40px">
            <a class="ev-btn" href="${x}" target="_blank" rel="noopener">Share on X</a>
            <a class="ev-btn" href="${li}" target="_blank" rel="noopener">Share on LinkedIn</a>
          </div>
          ${next ? `<div class="article-next"><span>Previous article</span><a href="article.html?p=${encodeURIComponent(next.slug)}">${esc(next.title)} →</a></div>` : ""}`;
      }
    }).catch(() => {});
  }

  // Publications
  const pubs = document.getElementById("pub-list");
  if (pubs) {
    getJSON("publications.json").then((items) => {
      items.sort((a, b) => new Date(b.date) - new Date(a.date));
      pubs.innerHTML = items.length
        ? items.map((p) => `
          <a class="pub-item" href="${esc(p.file)}" target="_blank" rel="noopener">
            <span class="pill">${esc(p.type || "Publication")}</span>
            <span class="pub-title">${esc(p.title)}</span>
            <span class="news-date">${p.date ? fmt(p.date) : ""}</span>
            <span class="news-more">Download PDF ↓</span>
          </a>`).join("")
        : '<p class="t-body" style="color:#666">Our first policy briefs and reports are in preparation. Join the <a href="contact.html" style="text-decoration:underline">mailing list</a> to receive them.</p>';
    }).catch(() => {});
  }
})();
