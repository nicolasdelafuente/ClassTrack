/**
 * ClassTrack runtime environment (mails, future feature flags).
 * Prefer APP_ENV over NODE_ENV so local Nest can run with NODE_ENV=development
 * while APP_ENV=testing/production for staging-like mail behaviour.
 */
export type AppEnv = 'production' | 'testing' | 'develop';

const DEFAULT_MAIL_REDIRECT_TO = 'ni.delafuente@gmail.com';

/** Loose but practical check after normalize (trim + lower). */
const EMAIL_RE = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized || normalized.length > 254) return false;
  return EMAIL_RE.test(normalized);
}

export function getAppEnv(): AppEnv {
  const raw = (
    process.env.APP_ENV ||
    process.env.NODE_ENV ||
    'develop'
  )
    .trim()
    .toLowerCase();

  if (raw === 'production' || raw === 'prod') return 'production';
  if (raw === 'testing' || raw === 'test' || raw === 'staging') {
    return 'testing';
  }
  // develop | development | local | anything else
  return 'develop';
}

export function isProductionEnv(): boolean {
  return getAppEnv() === 'production';
}

/** Non-prod override inbox (always the same unless MAIL_REDIRECT_TO is set). */
export function getMailRedirectTo(): string {
  const fromEnv = process.env.MAIL_REDIRECT_TO?.trim();
  return normalizeEmail(fromEnv || DEFAULT_MAIL_REDIRECT_TO);
}

export type MailRecipientLike = {
  email: string;
  name?: string | null;
};

export type PreparedMailRecipients<T extends MailRecipientLike> = {
  /** Recipients that will actually be sent to Mailjet. */
  to: T[];
  /** True when APP_ENV is not production and mail was redirected. */
  redirected: boolean;
  /** Valid unique emails before redirect (for logs / subject). */
  intended: string[];
};

/**
 * General rule before any send:
 * 1) normalize
 * 2) drop invalid addresses
 * 3) dedupe (case-insensitive)
 * 4) if not production → send only to MAIL_REDIRECT_TO (default ni.delafuente@gmail.com)
 */
export function prepareMailRecipients<T extends MailRecipientLike>(
  recipients: T[],
): PreparedMailRecipients<T> {
  const byEmail = new Map<string, T>();

  for (const recipient of recipients) {
    if (!recipient?.email || typeof recipient.email !== 'string') continue;
    const email = normalizeEmail(recipient.email);
    if (!isValidEmail(email)) continue;
    if (byEmail.has(email)) continue;
    byEmail.set(email, { ...recipient, email });
  }

  const cleaned = [...byEmail.values()];
  const intended = cleaned.map((r) => r.email);

  if (cleaned.length === 0) {
    return { to: [], redirected: false, intended: [] };
  }

  if (isProductionEnv()) {
    return { to: cleaned, redirected: false, intended };
  }

  const redirectTo = getMailRedirectTo();
  const first = cleaned[0];
  return {
    to: [
      {
        ...first,
        email: redirectTo,
        name: first.name?.trim() || 'ClassTrack (redirect)',
      },
    ],
    redirected: true,
    intended,
  };
}
