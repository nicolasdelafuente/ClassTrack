/**
 * Shared ClassTrack HTML email shell (CT-043).
 * Keep colors in sync with apps/web/src/index.css tokens.
 */
export type EmailLayoutInput = {
  title: string;
  /** Hidden preheader for inbox previews */
  preheader?: string;
  /** Already-safe HTML for the main content area */
  bodyHtml: string;
  footerNote?: string | null;
};

const COLORS = {
  surface: '#f5f5f3',
  surface1: '#ffffff',
  border: '#e8e6e1',
  fg: '#1a1a18',
  muted: '#5c5a52',
  faint: '#8a877c',
  accent: '#0f6b4c',
} as const;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Plain text → paragraphs with <br/> (for teacher-composed bodies). */
export function plainTextToHtml(text: string): string {
  const escaped = escapeHtml(text.trim());
  if (!escaped) return '<p style="margin:0;"></p>';
  return escaped
    .split(/\n{2,}/)
    .map((block) => {
      const withBreaks = block.replace(/\n/g, '<br/>');
      return `<p style="margin:0 0 12px;color:${COLORS.muted};font-size:15px;line-height:1.55;">${withBreaks}</p>`;
    })
    .join('');
}

export function renderEmailLayout(input: EmailLayoutInput): string {
  const preheader = input.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(input.preheader)}</div>`
    : '';
  const footer = input.footerNote
    ? `<p style="margin:0;color:${COLORS.faint};font-size:12px;line-height:1.4;">${escapeHtml(input.footerNote)}</p>`
    : `<p style="margin:0;color:${COLORS.faint};font-size:12px;line-height:1.4;">Enviado desde ClassTrack</p>`;

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:${COLORS.surface};font-family:system-ui,-apple-system,Segoe UI,sans-serif;">
  ${preheader}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.surface};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${COLORS.surface1};border:1px solid ${COLORS.border};border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:18px 24px;background:${COLORS.surface};border-bottom:1px solid ${COLORS.border};">
              <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${COLORS.accent};">ClassTrack</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;font-weight:700;color:${COLORS.fg};">${escapeHtml(input.title)}</h1>
              ${input.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;background:${COLORS.surface};border-top:1px solid ${COLORS.border};">
              ${footer}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
