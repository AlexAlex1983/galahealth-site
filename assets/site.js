/* ==========================================================================
   GALA Health — shared header, footer and form handling.
   Edit the NAV / CONTACT blocks once here and every page updates.
   ========================================================================== */

const SITE = {
  email: "info@galahealth.org",
  x: "https://x.com/GALA_Health",
  linkedin: "https://www.linkedin.com/company/gala-health/",
  address: "Rte de Meyrin 315, 1217 Meyrin, Geneva, Switzerland",
  logoHeader: "https://static.tildacdn.one/tild3661-6633-4733-b761-626364646562/noroot.png",
  logoFooter: "https://static.tildacdn.one/tild6635-3837-4230-a439-343634356233/50159fad1e0b568b82cc.png",
  // To collect form submissions without email clients, create a free form at
  // https://formspree.io (or similar) and paste its endpoint URL here.
  // Leave empty to fall back to opening the visitor's email app.
  formEndpoint: "",
};

const NAV = [
  { label: "Home", href: "index.html" },
  { label: "About", href: "about.html" },
  { label: "What We Do", href: "whatwedo.html" },
  { label: "Focus Areas", href: "index.html#focus-areas" },
  { label: "Contact", href: "contact.html" },
];
const FOCUS = [
  { label: "Country Support", href: "countrysupport.html" },
  { label: "Advocacy", href: "advocacy.html" },
  { label: "Caregiver Inclusion and Support", href: "caregiverinclusionandsupport.html" },
];

(function () {
  const page = location.pathname.split("/").pop() || "index.html";
  const isActive = (href) => href === page || (page === "" && href === "index.html");

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
        ${NAV.map((n) => `<a href="${n.href}">${n.label}</a>${n.label === "Focus Areas" ? FOCUS.map((f) => `<a class="sub" href="${f.href}">${f.label}</a>`).join("") : ""}`).join("")}
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
            <a href="index.html#focus-areas">Focus Area</a>
            <a href="contact.html">Contact</a>
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

  // Forms: <form data-gala-form="lead|newsletter">
  document.querySelectorAll("form[data-gala-form]").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = form.querySelector(".form-msg");
      const data = Object.fromEntries(new FormData(form).entries());
      data.form = form.dataset.galaForm;
      if (SITE.formEndpoint) {
        try {
          const r = await fetch(SITE.formEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(data),
          });
          if (!r.ok) throw new Error();
          form.reset();
          if (msg) msg.textContent = "Thank you! We'll be in touch soon.";
        } catch {
          if (msg) msg.textContent = `Something went wrong. Please email us at ${SITE.email}.`;
        }
      } else {
        const subject = data.form === "newsletter" ? "Mailing list subscription" : "Website enquiry";
        const body = Object.entries(data).filter(([k]) => k !== "form").map(([k, v]) => `${k}: ${v}`).join("\n");
        location.href = `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      }
    });
  });
})();
