/**
 * Shared HTML building blocks for emails. Every value that can come from a
 * person (names, messages, subjects, addresses) must go through escapeHtml —
 * the helpers below escape what they're given.
 */

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}

export type EmailBranding = { orgName: string; contactEmail: string };

/** Wraps already-built body HTML in the branded header/footer. */
export function layout(branding: EmailBranding, bodyHtml: string): string {
  const org = escapeHtml(branding.orgName);
  const contact = escapeHtml(branding.contactEmail);
  return `<div style="font-family:sans-serif;max-width:580px;margin:0 auto;color:#1F2937;padding:16px">
  <div style="background:#2D4D9B;padding:24px 32px;border-radius:12px 12px 0 0">
    <h1 style="color:#E8B20E;margin:0;font-size:20px">${org}</h1>
  </div>
  <div style="background:#ffffff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
    ${bodyHtml}
    <p style="margin:32px 0 0;font-size:12px;color:#6B7280;border-top:1px solid #f3f4f6;padding-top:16px">
      ${org} &mdash; <a href="mailto:${contact}" style="color:#2D4D9B">${contact}</a>
    </p>
  </div>
</div>`;
}

/** Call-to-action button; only http(s) links are allowed. */
export function ctaButton(href: string, label: string): string {
  const safeHref = /^https?:\/\//i.test(href) ? escapeHtml(href) : '#';
  return `<a href="${safeHref}" style="display:inline-block;background:#E8B20E;color:#1F2937;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:15px">${escapeHtml(label)}</a>`;
}

/** Table row with an escaped label and value. */
export function infoRow(label: string, value: string): string {
  return `<tr><td style="padding:6px 12px 6px 0;color:#6B7280;white-space:nowrap;font-size:14px;vertical-align:top">${escapeHtml(label)}</td><td style="padding:6px 0;font-weight:600;font-size:14px">${escapeHtml(value)}</td></tr>`;
}

/** Escaped paragraph text. */
export function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.5">${escapeHtml(text)}</p>`;
}
