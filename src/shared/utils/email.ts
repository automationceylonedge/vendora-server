import { env } from '../../config/env.js';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface SendEmailInput {
  to: EmailRecipient | EmailRecipient[];
  subject: string;
  htmlContent: string;
  replyTo?: EmailRecipient;
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  tags?: string[];
}

interface BrevoResponse {
  messageId?: string;
}

/**
 * Send a transactional email through Brevo.
 *
 * Never throws: failures are logged and reported as `false` so that email
 * delivery can never break an order flow.
 */
export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  if (!env.brevo.apiKey) {
    console.warn('⚠️ BREVO_API_KEY is not configured — email skipped');
    return false;
  }

  const recipients = Array.isArray(input.to) ? input.to : [input.to];
  if (recipients.length === 0 || !recipients.some((r) => r.email)) {
    return false;
  }

  const body = {
    sender: {
      email: env.brevo.senderEmail,
      name: env.brevo.senderName,
    },
    to: recipients.filter((r) => r.email),
    subject: input.subject,
    htmlContent: input.htmlContent,
    ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    ...(input.cc?.length ? { cc: input.cc } : {}),
    ...(input.bcc?.length ? { bcc: input.bcc } : {}),
    ...(input.tags?.length ? { tags: input.tags } : {}),
  };

  try {
    const res = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': env.brevo.apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`❌ Brevo email failed (${res.status}): ${text}`);
      return false;
    }

    const data = (await res.json().catch(() => ({}))) as BrevoResponse;
    console.log(`✅ Email sent to ${recipients.map((r) => r.email).join(', ')}${data.messageId ? ` (${data.messageId})` : ''}`);
    return true;
  } catch (err) {
    console.error('❌ Brevo email request failed:', err);
    return false;
  }
}
