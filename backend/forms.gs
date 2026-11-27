/**
 * GALA Health website forms -> Google Sheet + email notification.
 * Lives in the "GALA Health — Website submissions" Google Sheet
 * (Extensions > Apps Script). Deployed as a Web app: Execute as "Me", access "Anyone".
 * The web app URL goes into SITE.formEndpoint in assets/site.js.
 */
const NOTIFY_EMAIL = 'info@galahealth.org';
const SHEETS = {
  lead:       { name: 'Contact requests', cols: ['Received', 'Name', 'Organization', 'Email', 'Page'] },
  newsletter: { name: 'Mailing list',     cols: ['Received', 'Email', 'Page'] },
  lungcheck:  { name: 'Lung Check waitlist', cols: ['Received', 'Email', 'Role', 'Country', 'Breath donation interest', 'Consent', 'Page'] },
};

function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p.website) return json_({ ok: true });            // honeypot: bots fill hidden field
  const cfg = SHEETS[p.form] || SHEETS.lead;
  const email = String(p.email || '').trim().slice(0, 200);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json_({ ok: false, error: 'invalid email' });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName(cfg.name);
    if (!sh) { sh = ss.insertSheet(cfg.name); sh.appendRow(cfg.cols); sh.setFrozenRows(1); }
    const clean = (v) => String(v || '').replace(/^[=+\-@]/, "'$&").slice(0, 500); // no formula injection
    if (p.form === 'lungcheck') {
      // one row per address; quiz answers are never sent, only contact details and consent
      const last = sh.getLastRow();
      const seen = last > 1 && sh.getRange(2, 2, last - 1, 1).getValues().some((r) => String(r[0]).toLowerCase() === email.toLowerCase());
      if (!seen) sh.appendRow([new Date(), clean(email), clean(p.role), clean(p.country), p.donate === 'yes' ? 'yes' : 'no', p.consent === 'yes' ? 'yes' : 'no', clean(p.page)]);
      return json_({ ok: true });            // no email notification for waitlist sign-ups
    }
    const row = p.form === 'newsletter'
      ? [new Date(), email, clean(p.page)]
      : [new Date(), clean(p.name), clean(p.organization), email, clean(p.page)];
    sh.appendRow(row);
  } finally { lock.releaseLock(); }

  const subject = p.form === 'newsletter'
    ? 'New mailing list sign-up: ' + email
    : 'New website enquiry from ' + (p.name || email);
  const body = p.form === 'newsletter'
    ? email + ' joined the mailing list on galahealth.org.'
    : 'Name: ' + (p.name || '') + '\nOrganization: ' + (p.organization || '') + '\nEmail: ' + email +
      '\nPage: ' + (p.page || '') + '\n\nAll submissions: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl();
  MailApp.sendEmail({ to: NOTIFY_EMAIL, subject: subject, body: body, replyTo: email });
  return json_({ ok: true });
}

function doGet() { return json_({ ok: true, service: 'GALA Health website forms' }); }

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
