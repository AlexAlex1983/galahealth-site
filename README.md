# galahealth.org — static rebuild

A hand-coded replica of the Tilda site (Nov 2026). Plain HTML/CSS/JS — no build step, no framework.

## Structure
```
index.html                         Home
about.html                         About
whatwedo.html                      What We Do
countrysupport.html                Focus area: Country Support
advocacy.html                      Focus area: Advocacy
caregiverinclusionandsupport.html  Focus area: Caregiver Inclusion and Support
contact.html                       Contact + mailing list
privacy.html, terms.html           Placeholders (the Tilda site had no text on these)
assets/styles.css                  All styling — colours/fonts are variables at the top
assets/site.js                     Header, footer, menu and form handling (edit once, applies everywhere)
localize-images.sh                 Copies images off Tilda's CDN into assets/img/
```

## Editing
- **Text:** open the page's .html file and edit the words between the tags.
- **Menu, footer, email, address, X link:** `assets/site.js` (top of file).
- **Colours / font:** `assets/styles.css` (the `:root` block).

## Before going live
1. **Images** still load from Tilda's CDN (`static.tildacdn.one`). Run `bash localize-images.sh` once, while Tilda is still active, to download them into `assets/img/` and point the pages at the local copies.
2. **Forms**: Tilda processed the forms; a static site can't. Create a free form at formspree.io (or similar) and paste the endpoint into `formEndpoint` in `assets/site.js`. Until then the forms open the visitor's email app addressed to info@galahealth.org.
3. **Privacy Policy / Terms of Use**: add real text to `privacy.html` and `terms.html`.

## Hosting (same setup as news.galahealth.org)
1. Create a GitHub repo (e.g. `galahealth-site`), upload these files, enable **Settings → Pages** (branch `main`, root).
2. Add a file named `CNAME` containing `galahealth.org`.
3. In Namecheap DNS for galahealth.org: replace the Tilda records with GitHub Pages' four A records
   (185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153) and a `www` CNAME to `<your-github-user>.github.io`.
   Leave the `news` CNAME and the mail (MX) records untouched.
4. Tick **Enforce HTTPS** in GitHub Pages once the certificate is issued.

URLs changed from `/about` to `/about.html` (GitHub Pages serves both `/about` and `/about.html` for the same file, so old links keep working).
