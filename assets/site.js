/* ==========================================================================
   GALA Health — shared header, footer and form handling.
   Edit the NAV / CONTACT blocks once here and every page updates.
   ========================================================================== */

const SITE = {
  email: "info@galahealth.org",
  x: "https://x.com/GALA_Health",
  linkedin: "https://www.linkedin.com/company/gala-health/",
  address: "Rte de Meyrin 315, 1217 Meyrin, Geneva, Switzerland",
  logoHeader: "assets/img/tild3661-663-noroot.png",
  logoFooter: "assets/img/tild6635-383-50159fad1e0b568b82cc.png",
  // To collect form submissions without email clients, create a free form at
  // https://formspree.io (or similar) and paste its endpoint URL here.
  // Leave empty to fall back to opening the visitor's email app.
  // Privacy-friendly visitor counts (no cookies): sign up free at goatcounter.com and put your code here,
  // e.g. "galahealth" for galahealth.goatcounter.com. Leave empty to turn analytics off.
  goatcounter: "",
  formEndpoint: "https://script.google.com/macros/s/AKfycbxTuqAXYq-KRx-QnG0HQJZ0yoYoUcnAhyeAqg8uScAT3IfmTLxITxlGJmH885Jhtja7/exec",
};

const NAV = [
  { label: "About", href: "about.html" },
  { label: "What We Do", href: "whatwedo.html" },
  { label: "Focus Areas", href: "index.html#focus-areas" },
  { label: "Campaigns", href: "campaigns.html" },
  { label: "News", href: "news.html" },
  { label: "Contact", href: "contact.html" },
];
const TOOLS = [
  { label: "Lung Check", href: "lungcheck.html" },
  { label: "Lung Health Atlas", href: "atlas.html" },
  { label: "Investment case", href: "calculator.html" },
  { label: "Voices", href: "voices.html" },
  { label: "GALA Brief", href: "brief.html" },
  { label: "For partners", href: "partners.html" },
];
const FOCUS = [
  { label: "Country Support", href: "countrysupport.html" },
  { label: "Advocacy", href: "advocacy.html" },
  { label: "Caregiver Inclusion and Support", href: "caregiverinclusionandsupport.html" },
];

(function () {
  const page = location.pathname.split("/").pop() || "index.html";
  const isActive = (href) => href === page || (page === "article.html" && href === "news.html");

  const header = document.getElementById("site-header");
  if (header) {
    header.outerHTML = `
      <header class="site-header">
        <div class="container">
          <a class="logo" href="index.html" aria-label="GALA Health home"><img src="${SITE.logoHeader}" alt="GALA Health"></a>
          <nav class="nav" aria-label="Main">
            ${NAV.map((n) => `<a href="${n.href}"${isActive(n.href) ? ' class="active"' : ""}>${n.label}</a>`).join("")}
          </nav>
          <a class="btn" href="mailto:${SITE.email}">Get in Touch</a>
          <button class="burger" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button>
        </div>
      </header>
      <div class="mobile-menu" id="mobile-menu">
        <a href="index.html">Home</a>
        ${NAV.map((n) => `<a href="${n.href}">${n.label}</a>${n.label === "Focus Areas" ? FOCUS.map((f) => `<a class="sub" href="${f.href}">${f.label}</a>`).join("") : ""}`).join("")}
        <a href="lungcheck.html">Tools</a>${TOOLS.map((t) => `<a class="sub" href="${t.href}">${t.label}</a>`).join("")}
        <p style="margin-top:24px"><a class="btn" href="mailto:${SITE.email}" style="border:0">Get in Touch</a></p>
      </div>`;
    const burger = document.querySelector(".burger");
    const menu = document.getElementById("mobile-menu");
    burger.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      burger.setAttribute("aria-expanded", open);
    });
    menu.addEventListener("click", (e) => { if (e.target.tagName === "A") menu.classList.remove("open"); });
  }

  const footer = document.getElementById("site-footer");
  if (footer) {
    footer.outerHTML = `
      <footer class="site-footer">
        <div class="inner">
          <a class="logo" href="index.html"><img src="${SITE.logoFooter}" alt="GALA Health"></a>
          <nav aria-label="Footer">
            <a href="index.html">Home</a>
            <a href="about.html">About</a>
            <a href="whatwedo.html">What We Do</a>
            <a href="index.html#focus-areas">Focus Areas</a>
            <a href="campaigns.html">Campaigns</a>
            <a href="news.html">News</a>
            <a href="contact.html">Contact</a>
          </nav>
          <nav aria-label="Tools" class="footer-tools">
            ${TOOLS.map((t) => `<a href="${t.href}">${t.label}</a>`).join("")}
          </nav>
          <div class="big">
            <a href="mailto:${SITE.email}">Email: ${SITE.email}</a>
            <p class="share-line">Share options: <a href="${SITE.x}" target="_blank" rel="noopener">X</a> · <a href="${SITE.linkedin}" target="_blank" rel="noopener">LinkedIn</a></p>
          </div>
        </div>
        <div class="bottom">
          <address>Address: ${SITE.address}</address>
          <div class="legal">
            <a href="terms.html">Terms of Use</a>
            <a href="privacy.html">Privacy Policy</a>
          </div>
        </div>
      </footer>`;
  }

  if (SITE.goatcounter && !/embed/.test(page)) {
    const gc = document.createElement("script");
    gc.async = true; gc.src = "https://gc.zgo.at/count.js";
    gc.dataset.goatcounter = `https://${SITE.goatcounter}.goatcounter.com/count`;
    document.head.appendChild(gc);
  }

  // Forms: <form data-gala-form="lead|newsletter"> -> Google Apps Script web app (writes to a Google Sheet + emails info@)
  document.querySelectorAll("form[data-gala-form]").forEach((form) => {
    // invisible honeypot field to stop spam bots
    const hp = document.createElement("input");
    hp.type = "text"; hp.name = "website"; hp.tabIndex = -1; hp.autocomplete = "off";
    hp.setAttribute("aria-hidden", "true");
    hp.style.cssText = "position:absolute;left:-9999px;width:1px;height:1px;opacity:0";
    form.appendChild(hp);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = form.querySelector(".form-msg") || form.parentNode.querySelector(".form-msg");
      const btn = form.querySelector('button[type="submit"]');
      const data = new URLSearchParams(new FormData(form));
      data.set("form", form.dataset.galaForm);
      data.set("page", location.pathname);
      if (!SITE.formEndpoint) {
        location.href = `mailto:${SITE.email}?subject=${encodeURIComponent("Website enquiry")}&body=${encodeURIComponent([...data].filter(([k]) => !["form", "page", "website"].includes(k)).map(([k, v]) => `${k}: ${v}`).join("\n"))}`;
        return;
      }
      if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = "Sending…"; }
      try {
        // Apps Script doesn't send CORS headers, so the response is opaque; a network error still throws.
        await fetch(SITE.formEndpoint, { method: "POST", mode: "no-cors", body: data });
        form.reset();
        if (msg) msg.textContent = form.dataset.galaForm === "newsletter"
          ? "Thank you — you're on the list."
          : "Thank you! We'll be in touch soon.";
      } catch {
        if (msg) msg.textContent = `Something went wrong. Please email us at ${SITE.email}.`;
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label; }
      }
    });
  });
})();
