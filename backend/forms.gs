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
  voices:     { name: 'Voices stories', cols: ['Received', 'Name', 'Email', 'Country', 'Role', 'Story', 'Consent', 'Page'] },
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
    if (p.form === 'voices') {
      sh.appendRow([new Date(), clean(p.name), clean(email), clean(p.country), clean(p.role), String(p.story || '').replace(/^[=+\-@]/, "'$&").slice(0, 3000), p.consent === 'yes' ? 'yes' : 'no', clean(p.page)]);
      lock.releaseLock();
      MailApp.sendEmail({ to: NOTIFY_EMAIL, subject: 'New Voices story from ' + (p.name || email), replyTo: email,
        body: (p.role || '') + ', ' + (p.country || '') + '\n\n' + String(p.story || '').slice(0, 3000) + '\n\nAll stories: ' + ss.getUrl() });
      return json_({ ok: true });
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

/* ---------------- Monthly GALA Brief by email ----------------
 * Run setupMonthlyBrief() ONCE from the Apps Script editor (Run button).
 * It schedules sendMonthlyBrief() for the 2nd of each month at about 09:00 (script time zone),
 * which emails everyone on the "Mailing list" tab a short note linking to galahealth.org/brief.
 * To unsubscribe someone, delete their row from the Mailing list tab.
 */
function setupMonthlyBrief() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'sendMonthlyBrief').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('sendMonthlyBrief').timeBased().onMonthDay(2).atHour(9).create();
}

function sendMonthlyBrief() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.newsletter.name);
  if (!sh || sh.getLastRow() < 2) return;
  const emails = [...new Set(sh.getRange(2, 2, sh.getLastRow() - 1, 1).getValues().map(r => String(r[0]).trim().toLowerCase()).filter(e => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)))];
  const d = new Date(), months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const m = Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM'), label = months[d.getMonth()] + ' ' + d.getFullYear();
  const url = 'https://galahealth.org/brief?m=' + m;
  let news = [];
  try {
    const prev = Utilities.formatDate(new Date(d.getFullYear(), d.getMonth() - 1, 1), Session.getScriptTimeZone(), 'yyyy-MM');
    news = JSON.parse(UrlFetchApp.fetch('https://galahealth.org/data/news.json').getContentText()).filter(n => String(n.date).indexOf(prev) === 0);
  } catch (e) {}
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const html = '<div style="font-family:Arial,sans-serif;max-width:600px;color:#000">' +
    '<p style="color:#f88623;font-weight:bold;letter-spacing:1px">GALA BRIEF · ' + esc(label.toUpperCase()) + '</p>' +
    '<h2 style="color:#152d53">This month in lung health</h2>' +
    (news.length ? '<ul>' + news.map(n => '<li><b>' + esc(n.title) + '</b><br>' + esc(n.summary || '') + '</li>').join('') + '</ul>' : '') +
    '<p>Also inside: this month\'s awareness days, a country in focus from our Lung Health Atlas, and our free tools.</p>' +
    '<p><a href="' + url + '" style="background:#f88623;color:#fff;padding:12px 22px;border-radius:24px;text-decoration:none;font-weight:bold">Read the ' + esc(label) + ' brief</a></p>' +
    '<p style="color:#737373;font-size:12px;margin-top:30px">You receive this because you joined the GALA Health mailing list. Reply "unsubscribe" to stop.</p></div>';
  for (let i = 0; i < emails.length; i += 50) {
    MailApp.sendEmail({ to: NOTIFY_EMAIL, bcc: emails.slice(i, i + 50).join(','), subject: 'GALA Brief — ' + label, htmlBody: html, name: 'GALA Health' });
  }
}
