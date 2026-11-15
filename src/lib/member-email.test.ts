import { describe, expect, it } from 'vitest';
import { bodyToHtml, checkMemberEmail, fillPlaceholders, parseTemplate, renderMemberEmail, unfilledBlanks, unknownPlaceholders } from './member-email';

const branding = { orgName: 'Ambedkarite Buddhist Community of Canada', contactEmail: 'info@example.org' };

describe('placeholders', () => {
  it('fills first name, full name and organization name', () => {
    expect(fillPlaceholders('Jai Bhim {{first_name}} ({{ name }}) from {{ORG_NAME}}', { name: 'Savitri Phule' }, 'ABCC'))
      .toBe('Jai Bhim Savitri (Savitri Phule) from ABCC');
    expect(fillPlaceholders('Hi {{first_name}}', { name: '  ' }, 'ABCC')).toBe('Hi member');
  });

  it('reports unknown placeholders and unfilled template blanks', () => {
    expect(unknownPlaceholders('{{first_name}} {{phone}} {{phone}}')).toEqual(['{{phone}}']);
    expect(unfilledBlanks('Date: [DATE]\nPlace: [ADDRESS, OR ONLINE MEETING LINK] [DATE]')).toEqual(['[DATE]', '[ADDRESS, OR ONLINE MEETING LINK]']);
    expect(unfilledBlanks('Visit [our site] or see [1]')).toEqual(['[1]']);
  });
});

describe('bodyToHtml', () => {
  it('makes paragraphs and line breaks, escapes HTML and links web addresses', () => {
    const html = bodyToHtml('Hello <b>all</b>\nline two\n\nSee https://example.org/vote?id=1&x=2.');
    expect(html).toContain('Hello &lt;b&gt;all&lt;/b&gt;<br>line two</p>');
    expect(html).toContain('<a href="https://example.org/vote?id=1&amp;x=2" style="color:#2D4D9B">https://example.org/vote?id=1&amp;x=2</a>.');
    expect(html.match(/<p /g)).toHaveLength(2);
  });

  it('does not link javascript: or other schemes', () => {
    expect(bodyToHtml('javascript:alert(1) ftp://x')).not.toContain('<a');
  });
});

describe('renderMemberEmail', () => {
  it('personalises subject and body and adds the membership note', () => {
    const { subject, html } = renderMemberEmail({ subject: 'Hello {{first_name}}', body: 'Dear {{name}},' }, { name: 'Ravi Kamble' }, branding);
    expect(subject).toBe('Hello Ravi');
    expect(html).toContain('Dear Ravi Kamble,');
    expect(html).toContain('You’re receiving this email as a member of Ambedkarite Buddhist Community of Canada.');
  });
});

describe('validation', () => {
  it('requires subject and body and known placeholders', () => {
    expect(checkMemberEmail('', 'x')).toMatchObject({ ok: false });
    expect(checkMemberEmail('Hi', ' ')).toMatchObject({ ok: false });
    expect(checkMemberEmail('Hi {{phone}}', 'x')).toMatchObject({ ok: false, error: expect.stringContaining('{{phone}}') });
    expect(checkMemberEmail('Hi {{first_name}}', 'x')).toEqual({ ok: true });
  });

  it('validates templates', () => {
    expect(parseTemplate({ name: '', subject: 'S', body: 'B' })).toMatchObject({ ok: false });
    expect(parseTemplate({ name: ' Election ', subject: ' S ', body: 'B\r\nC ' })).toEqual({ ok: true, value: { name: 'Election', subject: 'S', body: 'B\nC' } });
  });
});
