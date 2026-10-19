import { describe, expect, it } from 'vitest';
import { ctaButton, escapeHtml, infoRow, layout, paragraph } from './email-templates';

describe('email templates', () => {
  it('escapes HTML in every helper', () => {
    expect(escapeHtml(`<script>alert("x")</script> & 'y'`)).toBe('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;y&#39;');
    expect(infoRow('Name', '<b>Ravi</b>')).toContain('&lt;b&gt;Ravi&lt;/b&gt;');
    expect(paragraph('<a href="https://evil.example">click</a>')).not.toContain('<a href');
    expect(layout({ orgName: 'A <b>', contactEmail: 'x@y.example' }, '<p>body</p>')).toContain('A &lt;b&gt;');
  });

  it('only allows http(s) links in buttons', () => {
    expect(ctaButton('https://site.example/profile', 'Go')).toContain('href="https://site.example/profile"');
    expect(ctaButton('javascript:alert(1)', 'Go')).toContain('href="#"');
    expect(ctaButton('mailto:a%40b.example?subject=Hi', 'Reply', 'secondary')).toContain('href="mailto:a%40b.example?subject=Hi"');
    expect(ctaButton('data:text/html,x', 'Go')).toContain('href="#"');
  });
});
