import { Injectable, Logger } from '@nestjs/common';
import {
  getAppEnv,
  prepareMailRecipients,
  type AppEnv,
} from '../config/app-env';
import {
  escapeHtml,
  renderEmailLayout,
} from './email-layout';

export type SendInviteEmailInput = {
  toEmail: string;
  toName?: string | null;
  roleLabel: string;
  inviteUrl: string;
  courseName?: string | null;
};

export type SendEmailResult = {
  emailed: boolean;
  reason?: string;
  /** Env used for this send (handy for UI / debugging). */
  appEnv?: AppEnv;
  /** True when recipients were redirected to MAIL_REDIRECT_TO. */
  redirected?: boolean;
  /** Intended recipients before redirect / after dedupe. */
  intendedRecipients?: string[];
};

export type MailRecipient = {
  email: string;
  name?: string | null;
};

export type SendHtmlEmailInput = {
  to: MailRecipient[];
  subject: string;
  html: string;
  text: string;
};

/**
 * Mailjet transactional sender (CT-042 / CT-043).
 * If API keys are missing, returns emailed=false so the UI can show a copy link / local mode.
 *
 * All outbound mail goes through {@link prepareMailRecipients}:
 * validate → dedupe → redirect to MAIL_REDIRECT_TO when APP_ENV ≠ production.
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
  ): Promise<SendEmailResult> {
    const courseLine = input.courseName
      ? `<p style="margin:0 0 12px;color:#5c5a52;font-size:14px;">Cursada: <strong>${escapeHtml(input.courseName)}</strong></p>`
      : '';

    const bodyHtml = `
      <p style="margin:0 0 12px;color:#5c5a52;font-size:15px;line-height:1.55;">
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
    `;

    const html = renderEmailLayout({
      title: 'Te invitaron a registrarte',
      preheader: `Invitación a ClassTrack como ${input.roleLabel}`,
      bodyHtml,
      footerNote: input.courseName
        ? `${input.courseName} · Enviado desde ClassTrack`
        : 'Enviado desde ClassTrack',
    });

    return this.sendHtmlEmail({
      to: [{ email: input.toEmail, name: input.toName }],
      subject: 'Invitación a ClassTrack',
      html,
      text: `Te invitaron a ClassTrack como ${input.roleLabel}. Completá el registro: ${input.inviteUrl}`,
    });
  }

  /**
   * Send the same HTML to many recipients (broadcast / invites).
   * Mailjet accepts up to 50 Messages per request — we chunk.
   */
  async sendHtmlEmail(input: SendHtmlEmailInput): Promise<SendEmailResult> {
    const appEnv = getAppEnv();
    const prepared = prepareMailRecipients(input.to);

    if (prepared.to.length === 0) {
      return {
        emailed: false,
        reason: 'no_recipients',
        appEnv,
        redirected: prepared.redirected,
        intendedRecipients: prepared.intended,
      };
    }

    let subject = input.subject;
    let text = input.text;
    let html = input.html;

    if (prepared.redirected) {
      const intendedList = prepared.intended.join(', ');
      this.logger.warn(
        `Mail redirect (${appEnv}): intended [${intendedList}] → ${prepared.to[0].email}`,
      );
      subject = `[${appEnv}] ${input.subject}`;
      const redirectNote = `\n\n[ClassTrack ${appEnv}] Destinatarios originales: ${intendedList}`;
      text = `${input.text}${redirectNote}`;
      html = `${input.html}<p style="margin:24px 0 0;padding-top:12px;border-top:1px solid #e8e6df;color:#8a877c;font-size:12px;">[${escapeHtml(appEnv)}] Destinatarios originales: ${escapeHtml(intendedList)}</p>`;
    }

    if (!this.isConfigured()) {
      this.logger.warn(
        `Mailjet not configured — would send "${subject}" to ${prepared.to.map((r) => r.email).join(', ')} (intended: ${prepared.intended.join(', ') || '—'})`,
      );
      return {
        emailed: false,
        reason: 'mailjet_not_configured',
        appEnv,
        redirected: prepared.redirected,
        intendedRecipients: prepared.intended,
      };
    }

    const apiKey = process.env.MAILJET_API_KEY!.trim();
    const apiSecret = process.env.MAILJET_API_SECRET!.trim();
    const fromEmail = process.env.MAILJET_FROM_EMAIL!.trim();
    const fromName = process.env.MAILJET_FROM_NAME?.trim() || 'ClassTrack';
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

    const chunkSize = 50;
    let anyOk = false;
    let lastReason: string | undefined;

    for (let i = 0; i < prepared.to.length; i += chunkSize) {
      const chunk = prepared.to.slice(i, i + chunkSize);
      const body = {
        Messages: chunk.map((r) => ({
          From: { Email: fromEmail, Name: fromName },
          To: [
            {
              Email: r.email,
              Name: r.name?.trim() || r.email,
            },
          ],
          Subject: subject,
          HTMLPart: html,
          TextPart: text,
        })),
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
          const errText = await res.text();
          this.logger.error(`Mailjet error ${res.status}: ${errText}`);
          lastReason = `mailjet_http_${res.status}`;
        } else {
          anyOk = true;
        }
      } catch (err) {
        this.logger.error('Mailjet request failed', err);
        lastReason = 'mailjet_request_failed';
      }
    }

    if (!anyOk) {
      return {
        emailed: false,
        reason: lastReason ?? 'mailjet_failed',
        appEnv,
        redirected: prepared.redirected,
        intendedRecipients: prepared.intended,
      };
    }

    return {
      emailed: true,
      appEnv,
      redirected: prepared.redirected,
      intendedRecipients: prepared.intended,
    };
  }
}
