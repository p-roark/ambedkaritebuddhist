import { escapeHtml, layout, type EmailBranding } from '@/lib/email-templates';

/**
 * Emails to members (Dashboard → Email Members). Templates are plain text:
 * blank lines separate paragraphs, web addresses become links, and these
 * placeholders are filled in for each member.
 */
export const MEMBER_EMAIL_PLACEHOLDERS = {
  first_name: 'First name, e.g. “Savitri”',
  name: 'Full name, e.g. “Savitri Phule”',
  org_name: 'Organization name',
} as const;

export type MemberEmailPlaceholder = keyof typeof MEMBER_EMAIL_PLACEHOLDERS;

export const MAX_SUBJECT_LENGTH = 200;
export const MAX_BODY_LENGTH = 20_000;

const PLACEHOLDER_PATTERN = /\{\{\s*([a-z_]+)\s*\}\}/gi;

/** {{placeholders}} in the text that aren't ones we can fill in. */
export function unknownPlaceholders(text: string): string[] {
  const unknown = new Set<string>();
  for (const [, key] of text.matchAll(PLACEHOLDER_PATTERN)) {
    if (!(key.toLowerCase() in MEMBER_EMAIL_PLACEHOLDERS)) unknown.add(`{{${key}}}`);
  }
  return [...unknown];
}

/** Template blanks an admin still has to fill in, e.g. [DATE] or [EVENT NAME]. */
export function unfilledBlanks(text: string): string[] {
  return [...new Set(text.match(/\[[A-Z0-9][A-Z0-9 ,.'’/&:()-]*\]/g) ?? [])];
}

export type MemberEmailRecipient = { name: string };

function placeholderValues(recipient: MemberEmailRecipient, orgName: string): Record<MemberEmailPlaceholder, string> {
  const name = recipient.name.trim() || 'member';
  return { first_name: name.split(/\s+/)[0], name, org_name: orgName };
}

/** Fills {{placeholders}} (plain text; escape before putting it in HTML). */
export function fillPlaceholders(text: string, recipient: MemberEmailRecipient, orgName: string): string {
  const values = placeholderValues(recipient, orgName);
  return text.replace(PLACEHOLDER_PATTERN, (match, key: string) => values[key.toLowerCase() as MemberEmailPlaceholder] ?? match);
}

const URL_PATTERN = /\bhttps?:\/\/[^\s<]+[^\s<.,;:!?)\]'"’”]/g;

/** Plain-text body → HTML paragraphs, with every value escaped and web addresses linked. */
export function bodyToHtml(body: string): string {
  return body
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => {
      const lines = paragraph.split('\n').map((line) => {
        let html = '';
        let last = 0;
        for (const match of line.matchAll(URL_PATTERN)) {
          const url = match[0];
          html += escapeHtml(line.slice(last, match.index)) +
            `<a href="${escapeHtml(url)}" style="color:#2D4D9B">${escapeHtml(url)}</a>`;
          last = (match.index ?? 0) + url.length;
        }
        return html + escapeHtml(line.slice(last));
      });
      return `<p style="margin:0 0 16px;color:#1F2937;font-size:15px;line-height:1.6">${lines.join('<br>')}</p>`;
    })
    .join('\n');
}

/** The subject and HTML one member receives. */
export function renderMemberEmail(
  message: { subject: string; body: string },
  recipient: MemberEmailRecipient,
  branding: EmailBranding,
): { subject: string; html: string } {
  const subject = fillPlaceholders(message.subject, recipient, branding.orgName);
  const body = fillPlaceholders(message.body, recipient, branding.orgName);
  const html = layout(
    branding,
    `${bodyToHtml(body)}
    <p style="margin:24px 0 0;font-size:12px;color:#6B7280">You’re receiving this email as a member of ${escapeHtml(branding.orgName)}.</p>`,
  );
  return { subject, html };
}

export type MemberEmailCheck = { ok: true } | { ok: false; error: string };

/** Subject and body are present, not too long, and use only known placeholders. */
export function checkMemberEmail(subject: string, body: string): MemberEmailCheck {
  if (!subject.trim()) return { ok: false, error: 'Please enter a subject.' };
  if (!body.trim()) return { ok: false, error: 'Please enter the message.' };
  if (subject.length > MAX_SUBJECT_LENGTH) return { ok: false, error: `Please keep the subject under ${MAX_SUBJECT_LENGTH} characters.` };
  if (body.length > MAX_BODY_LENGTH) return { ok: false, error: `Please keep the message under ${MAX_BODY_LENGTH.toLocaleString('en-CA')} characters.` };
  const unknown = unknownPlaceholders(`${subject}\n${body}`);
  if (unknown.length > 0) {
    return {
      ok: false,
      error: `Unknown placeholder${unknown.length > 1 ? 's' : ''} ${unknown.join(', ')}. Use ${Object.keys(MEMBER_EMAIL_PLACEHOLDERS).map((k) => `{{${k}}}`).join(', ')}.`,
    };
  }
  return { ok: true };
}

export const MAX_TEMPLATE_NAME_LENGTH = 80;

export type TemplateInput = { name: string; subject: string; body: string };

/** Validates a template from a request body (Dashboard → Email Members → templates). */
export function parseTemplate(raw: unknown): { ok: true; value: TemplateInput } | { ok: false; error: string } {
  const body = (raw ?? {}) as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const text = typeof body.body === 'string' ? body.body.replace(/\r\n/g, '\n').trim() : '';
  if (!name) return { ok: false, error: 'Please give the template a name.' };
  if (name.length > MAX_TEMPLATE_NAME_LENGTH) return { ok: false, error: `Please keep the name under ${MAX_TEMPLATE_NAME_LENGTH} characters.` };
  const check = checkMemberEmail(subject, text);
  if (!check.ok) return check;
  return { ok: true, value: { name, subject, body: text } };
}
