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

## Live since 15 Nov 2026
galahealth.org points at GitHub Pages (Namecheap: four `@` A records 185.199.108–111.153, `www` CNAME → alexalex1983.github.io).
**Rollback to Tilda** (only while the Tilda subscription is active): set `@` A → 194.48.203.131, delete the other three `@` A records,
change `www` back to an A record → 194.48.203.131, and delete the `CNAME` file in this repo.

## News & Publications (moved here from news.galahealth.org, Nov 2026)
- **News:** edit `data/news.json`. Each entry: `title`, `date` (YYYY-MM-DD), `summary`, `body` (use `\n\n` between paragraphs),
  optional `image` (e.g. `assets/img/my-photo.jpg`), `imageCredit` (e.g. "© WHO / Name") and `slug` (URL name; made from the title if missing).
  The newest post is featured on news.html and the top three appear on the Home page. Each post gets its own page: `article.html?p=<slug>`.
- **Publications:** edit `data/publications.json` — `title`, `type` (e.g. "Policy Brief"), `date`, `file` (put PDFs in `publications/`).
- news.galahealth.org now forwards to galahealth.org/news.html (and old article links to the matching page).
  Article bodies support light formatting: `## Heading`, lines starting with `- ` for bullet lists, `**bold**`, and `[link text](https://...)`.

## Hear Your Lungs — Lung Check (Nov 2026)
- Page: `lungcheck.html` (styles `assets/lungcheck.css`, logic `assets/lungcheck.js`). Promo bands on Home and Campaigns link to it.
- Questions, scoring and result wording are at the top of `assets/lungcheck.js` (`Q`, `BANDS`, `AQI`).
- Answers never leave the browser. Air quality comes from the Open-Meteo Air Quality API (free for non-profit sites without ads/subscriptions, CC BY 4.0; keep the credit line on the page).
- Waitlist sign-ups post to `SITE.formEndpoint` with `form=lungcheck` and land in the "Lung Check waitlist" tab of the website-submissions sheet (no email notification).
  After changing `backend/forms.gs`, paste it into the sheet's Apps Script and use **Deploy → Manage deployments → Edit → Version: New version** so the URL stays the same.

## Tools added Nov 2026
| Page | What it is | Content / data |
|---|---|---|
| `atlas.html` | Lung Health Atlas: world map + country profiles | `data/atlas.json`, `data/world.json`, refreshed monthly by `.github/workflows/atlas-data.yml` (`scripts/build_atlas.py`, `scripts/build_world.py`) from WHO GHO, World Bank, Our World in Data, Natural Earth |
| `calculator.html` | COPD investment case (undiagnosed COPD, tests needed, programme cost) | World Bank population 30–79 and health spending from `data/atlas.json`; evidence defaults cited on the page |
| `partners.html`, `lungcheck-embed.html` | Partners get a tracked link (`?partner=`) and iframe code; `?lang=fr|es|ru` for other languages | — |
| `voices.html` | Patient / caregiver / health-worker stories + submission form | Publish approved stories by adding to `data/voices.json`: `[{"quote": "...", "name": "...", "country": "...", "role": "...", "story": "optional full text"}]` |
| `brief.html` | Monthly GALA Brief (`brief.html?m=2026-12`): month's news, awareness days, country in focus, tools | `data/news.json`, `data/events.js`, `data/atlas.json` |
| `lungcheck-fr/es/ru.html` | Lung Check in French, Spanish, Russian | Strings in `assets/lungcheck-i18n.js` |

IHME (Global Burden of Disease) files can't be downloaded automatically, so the atlas's death-rate layer uses the WHO Mortality Database (only countries that report; reports older than 2015 hidden).

### One-time setup still needed
1. **Forms script**: paste `backend/forms.gs` into the website-submissions sheet's Apps Script → Deploy → Manage deployments → Edit → New version. Adds the Lung Check waitlist, Voices stories and the monthly brief.
2. **Monthly brief email**: in the same Apps Script editor, choose `setupMonthlyBrief` and press Run once (authorise). Sends on the 2nd of each month to the Mailing list tab.
3. **Analytics (optional)**: create a free site at goatcounter.com (code e.g. `galahealth`) and put the code in `SITE.goatcounter` in `assets/site.js`.
4. **Google Search Console**: add `galahealth.org` as a Domain property (DNS TXT record in Namecheap), then submit `https://galahealth.org/sitemap.xml`.
