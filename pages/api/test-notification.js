// Sends a sample order to the configured recipients so the mailbox can be
// verified without taking a real card. Disabled unless NOTIFY_TEST_SECRET is
// set, and it never reveals the credentials themselves.
//
//   curl "https://invitation.gemsworlddialogue.com/api/test-notification?secret=..."

import { recipients, sendTestNotification, smtpConfig } from '../../lib/notify';

export default async function handler(req, res) {
  const secret = process.env.NOTIFY_TEST_SECRET;

  // No secret configured means the endpoint does not exist at all.
  if (!secret) return res.status(404).json({ error: 'Not found.' });
  if (req.query.secret !== secret) return res.status(404).json({ error: 'Not found.' });

  const smtp = smtpConfig();
  const to = recipients();

  if (!smtp || to.length === 0) {
    return res.status(503).json({
      ok: false,
      smtpConfigured: Boolean(smtp),
      recipients: to,
      error: !smtp
        ? 'Set SMTP_HOST, SMTP_USER and SMTP_PASS.'
        : 'Set ORDER_NOTIFICATION_EMAILS.',
    });
  }

  try {
    const result = await sendTestNotification();
    return res.status(result.sent ? 200 : 500).json({
      ...result,
      recipients: to,
      smtp: { host: smtp.host, port: smtp.port, secure: smtp.secure, from: smtp.from },
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message, recipients: to });
  }
}
