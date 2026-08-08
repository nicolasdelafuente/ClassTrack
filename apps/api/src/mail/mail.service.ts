import { Injectable, Logger } from '@nestjs/common';

export type SendInviteEmailInput = {
  toEmail: string;
  toName?: string | null;
  roleLabel: string;
  inviteUrl: string;
  courseName?: string | null;
};

export type SendInviteEmailResult = {
  emailed: boolean;
  reason?: string;
};

/**
 * Mailjet transactional sender (CT-042).
 * If API keys are missing, returns emailed=false so the UI can show a copy link.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  isConfigured(): boolean {
    return Boolean(
      process.env.MAILJET_API_KEY?.trim() &&
        process.env.MAILJET_API_SECRET?.trim() &&
        process.env.MAILJET_FROM_EMAIL?.trim(),
    );
  }

  async sendInviteEmail(
    input: SendInviteEmailInput,
  ): Promise<SendInviteEmailResult> {
    if (!this.isConfigured()) {
      this.logger.warn(
        `Mailjet not configured — invite link for ${input.toEmail}: ${input.inviteUrl}`,
      );
      return { emailed: false, reason: 'mailjet_not_configured' };
    }

    const apiKey = process.env.MAILJET_API_KEY!.trim();
    const apiSecret = process.env.MAILJET_API_SECRET!.trim();
    const fromEmail = process.env.MAILJET_FROM_EMAIL!.trim();
    const fromName = process.env.MAILJET_FROM_NAME?.trim() || 'ClassTrack';
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

    const courseLine = input.courseName
      ? `<p style="margin:0 0 12px;color:#5c5a52;font-size:14px;">Cursada: <strong>${escapeHtml(input.courseName)}</strong></p>`
      : '';

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a18;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#0f6b4c;">ClassTrack</p>
        <h1 style="margin:0 0 12px;font-size:22px;">Te invitaron a registrarte</h1>
        <p style="margin:0 0 12px;color:#5c5a52;font-size:14px;line-height:1.5;">
          Vas a crear una cuenta de <strong>${escapeHtml(input.roleLabel)}</strong>.
        </p>
        ${courseLine}
        <p style="margin:0 0 20px;">
          <a href="${escapeHtml(input.inviteUrl)}"
             style="display:inline-block;background:#0f6b4c;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-size:14px;font-weight:600;">
            Completar registro
          </a>
        </p>
        <p style="margin:0;color:#8a877c;font-size:12px;line-height:1.4;">
          Si el botón no funciona, copiá este link:<br/>
          <span style="word-break:break-all;">${escapeHtml(input.inviteUrl)}</span>
        </p>
      </div>
    `;

    const body = {
      Messages: [
        {
          From: { Email: fromEmail, Name: fromName },
          To: [
            {
              Email: input.toEmail,
              Name: input.toName?.trim() || input.toEmail,
            },
          ],
          Subject: 'Invitación a ClassTrack',
          HTMLPart: html,
          TextPart: `Te invitaron a ClassTrack como ${input.roleLabel}. Completá el registro: ${input.inviteUrl}`,
        },
      ],
    };

    try {
      const res = await fetch('https://api.mailjet.com/v3.1/send', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        this.logger.error(`Mailjet error ${res.status}: ${text}`);
        return { emailed: false, reason: `mailjet_http_${res.status}` };
      }
      return { emailed: true };
    } catch (err) {
      this.logger.error('Mailjet request failed', err);
      return { emailed: false, reason: 'mailjet_request_failed' };
    }
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
