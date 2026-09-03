import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: \Method \ Not Allowed\ });
  }

  try {
    const { name, email, message, company, service } = req.body;

    if (!email || !message) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const toEmail = process.env.CONTACT_TO_EMAIL || 'olumidesajowa@gmail.com';
    const fromEmail = process.env.CONTACT_FROM_EMAIL || 'onboarding@resend.dev';

    const data = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject: \New Portfolio Inquiry from \\,
      text: \Name: \\nEmail: \\nCompany: \\nService: \\n\nMessage:\n\\,
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
