// /api/contact.js
// Vercel Serverless Function — Contact Form Handler
// Sends two emails via Resend: a notification to Olumide, and a confirmation to the sender.
// Ported from the original portfolio-uvgo implementation, with reCAPTCHA made optional
// (it only runs if RECAPTCHA_SECRET_KEY is set) since this site doesn't have a site key yet.
//
// Setup on Vercel:
//   1. npm install resend  (package.json already lists it)
//   2. Vercel → Project → Settings → Environment Variables:
//        RESEND_API_KEY        (required)
//        CONTACT_TO_EMAIL      (optional, defaults to olumidesajowa@gmail.com)
//        CONTACT_FROM_EMAIL    (optional, defaults to Resend's shared onboarding@resend.dev
//                                sender until a custom domain is verified in Resend)
//        RECAPTCHA_SECRET_KEY  (optional — omit until reCAPTCHA is wired up client-side)
//   3. In Resend, once a domain is bought and verified, set CONTACT_FROM_EMAIL to
//      something like "Portfolio Contact <hello@yourdomain.com>" for better deliverability.

const { Resend } = require('resend');

const TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'olumidesajowa@gmail.com';
const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'Portfolio Contact <onboarding@resend.dev>';
const SITE_URL = process.env.SITE_URL || 'https://portfolio-uvgo.vercel.app';

// ── Rate limiting (in-memory, resets per cold start) ──────────
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;

function isRateLimited(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record) { rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW }); return false; }
  if (now > record.resetAt) { rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW }); return false; }
  if (record.count >= RATE_LIMIT_MAX) return true;
  record.count++;
  return false;
}

// ── reCAPTCHA v3 (optional — skipped if no secret key configured) ──
async function verifyRecaptcha(token) {
  if (!process.env.RECAPTCHA_SECRET_KEY) return { skipped: true, success: true, score: 1 };
  if (!token) return { success: false, score: 0 };
  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
    });
    return await res.json();
  } catch {
    return { success: false, score: 0 };
  }
}

function sanitise(str, maxLen = 2000) {
  if (typeof str !== 'string') return '';
  return str.slice(0, maxLen).replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildNotificationEmail(name, email, subject, message, sentAt) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
  <body style="margin:0;padding:0;background:#0a0906;font-family:-apple-system,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0906;padding:40px 20px;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#111009;border:1px solid rgba(245,244,238,0.12);">
          <tr><td style="padding:32px 40px;border-bottom:1px solid rgba(245,244,238,0.12);">
            <p style="margin:0;font-size:11px;letter-spacing:0.05em;color:#8c897c;font-family:monospace;text-transform:uppercase;">Portfolio contact</p>
            <h1 style="margin:8px 0 0;font-size:22px;font-weight:600;color:#f5f4ee;">New message from your site</h1>
          </td></tr>
          <tr><td style="padding:28px 40px 0;">
            <p style="margin:0 0 4px;font-size:11px;color:#8c897c;font-family:monospace;">FROM</p>
            <p style="margin:0 0 18px;font-size:16px;color:#f5f4ee;">${name} &lt;<a href="mailto:${email}" style="color:#ff4b34;">${email}</a>&gt;</p>
            <p style="margin:0 0 4px;font-size:11px;color:#8c897c;font-family:monospace;">LOOKING FOR</p>
            <p style="margin:0 0 18px;font-size:15px;color:#f5f4ee;">${subject}</p>
            <p style="margin:0 0 4px;font-size:11px;color:#8c897c;font-family:monospace;">MESSAGE</p>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#e5e4dd;white-space:pre-wrap;border-left:2px solid #ff4b34;padding-left:16px;">${message}</p>
            <p style="margin:0 0 24px;font-size:12px;color:#57554a;font-family:monospace;">Sent ${sentAt}</p>
          </td></tr>
          <tr><td style="padding:0 40px 32px;">
            <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)}" style="display:inline-block;background:#ff4b34;color:#0a0906;text-decoration:none;font-size:13px;font-weight:600;padding:12px 24px;border-radius:100px;">Reply to ${name}</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>`;
}

function buildConfirmationEmail(name, subject, sentAt) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
  <body style="margin:0;padding:0;background:#0a0906;font-family:-apple-system,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0906;padding:40px 20px;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#111009;border:1px solid rgba(245,244,238,0.12);">
          <tr><td style="padding:36px 40px;border-bottom:1px solid rgba(245,244,238,0.12);">
            <p style="margin:0;font-size:11px;letter-spacing:0.05em;color:#8c897c;font-family:monospace;text-transform:uppercase;">Olumide Sajowa</p>
            <h1 style="margin:10px 0 0;font-size:24px;font-weight:600;color:#f5f4ee;">Message received.</h1>
          </td></tr>
          <tr><td style="padding:32px 40px;">
            <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#e5e4dd;">Hi ${name},</p>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#c9c7bb;">Thanks for reaching out about <strong style="color:#f5f4ee;">${subject}</strong>. I reply within two business days.</p>
            <a href="${SITE_URL}" style="display:inline-block;margin-top:8px;background:#ff4b34;color:#0a0906;text-decoration:none;font-size:13px;font-weight:600;padding:12px 24px;border-radius:100px;">View the work</a>
            <p style="margin:28px 0 0;font-size:11px;color:#57554a;">Sent ${sentAt} &middot; This is an automated confirmation.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const allowedOrigins = [SITE_URL, 'http://localhost:3000', 'http://127.0.0.1:5500'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(ip)) return res.status(429).json({ error: 'Too many requests. Please try again later.' });

  try {
    const { name, email, subject, message, honey, recaptchaToken } = req.body || {};

    if (honey) return res.status(200).json({ ok: true }); // bot caught by honeypot, fake success

    if (!name || name.trim().length < 2) return res.status(400).json({ error: 'Invalid name.' });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return res.status(400).json({ error: 'Invalid email.' });
    if (!subject || subject.trim().length < 1) return res.status(400).json({ error: 'Subject required.' });
    if (!message || message.trim().length < 20) return res.status(400).json({ error: 'Message too short.' });

    const recaptchaResult = await verifyRecaptcha(recaptchaToken);
    if (!recaptchaResult.skipped && (!recaptchaResult.success || (recaptchaResult.score ?? 1) < 0.5)) {
      return res.status(400).json({ error: 'Security check failed. Please refresh and try again.' });
    }

    const safeName = sanitise(name.trim(), 100);
    const safeEmail = sanitise(email.trim(), 254);
    const safeSubject = sanitise(subject.trim(), 200);
    const safeMessage = sanitise(message.trim(), 2000);
    const sentAt = new Date().toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Africa/Lagos' });

    const resend = new Resend(process.env.RESEND_API_KEY);

    const [notifyResult, confirmResult] = await Promise.allSettled([
      resend.emails.send({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        replyTo: safeEmail,
        subject: `New message: ${safeSubject}`,
        html: buildNotificationEmail(safeName, safeEmail, safeSubject, safeMessage, sentAt),
      }),
      resend.emails.send({
        from: FROM_EMAIL,
        to: [safeEmail],
        subject: `I've received your message — Olumide Sajowa`,
        html: buildConfirmationEmail(safeName, safeSubject, sentAt),
      }),
    ]);

    if (notifyResult.status === 'rejected' || notifyResult.value?.error) {
      console.error('Notification email failed:', notifyResult.reason || notifyResult.value?.error);
      return res.status(500).json({ error: 'Failed to send message. Please email directly.' });
    }
    if (confirmResult.status === 'rejected') {
      console.warn('Confirmation email failed (non-critical):', confirmResult.reason);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Contact handler error:', err);
    return res.status(500).json({ error: 'Server error. Please email directly.' });
  }
};
