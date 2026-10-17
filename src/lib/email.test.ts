// @vitest-environment node
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Sender lookup reads D1; tests use a fixed sender per purpose
const resolveSenderMock = vi.hoisted(() => vi.fn());
vi.mock('@/lib/email-senders-server', () => ({ resolveSender: resolveSenderMock }));

const { sendTestEmail } = await import('./email');

// Throwaway RSA key generated per test run — never a real credential
let testKeyPem = '';
beforeAll(async () => {
  const pair = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  );
  const der = Buffer.from(await crypto.subtle.exportKey('pkcs8', pair.privateKey)).toString('base64');
  // Stored the way Cloudflare secrets often keep it: literal \n sequences
  testKeyPem = `-----BEGIN PRIVATE KEY-----\\n${der.match(/.{1,64}/g)?.join('\\n')}\\n-----END PRIVATE KEY-----\\n`;
});

const fetchMock = vi.fn();
beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  vi.stubEnv('GMAIL_SERVICE_ACCOUNT_EMAIL', 'sender@project.iam.gserviceaccount.com');
  vi.stubEnv('GMAIL_PRIVATE_KEY', testKeyPem);
  resolveSenderMock.mockReset();
  resolveSenderMock.mockImplementation(async (purpose?: string) =>
    purpose === 'registrations'
      ? { address: 'registrations@example.org', name: 'Ambedkarite Buddhist Community', source: 'purpose' }
      : { address: 'contact@example.org', name: 'Ambedkarite Buddhist Community', source: 'organization' },
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const tokenOk = () => new Response(JSON.stringify({ access_token: 'token-123' }), { status: 200 });

describe('sendTestEmail', () => {
  it('reports missing secrets by name without calling Google', async () => {
    vi.stubEnv('GMAIL_PRIVATE_KEY', '');
    const result = await sendTestEmail('admin@example.org', 'admin@example.org');
    expect(result).toMatchObject({ ok: false, stage: 'config', missing: ['GMAIL_PRIVATE_KEY'] });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports an unreadable private key', async () => {
    vi.stubEnv('GMAIL_PRIVATE_KEY', '-----BEGIN PRIVATE KEY-----\\nnot-a-key\\n-----END PRIVATE KEY-----');
    const result = await sendTestEmail('admin@example.org', 'admin@example.org');
    expect(result).toMatchObject({ ok: false, stage: 'key' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('explains missing domain-wide delegation', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{"error":"unauthorized_client","error_description":"Client is unauthorized"}', { status: 401 }));
    const result = await sendTestEmail('admin@example.org', 'admin@example.org');
    expect(result).toMatchObject({ ok: false, stage: 'token', from: 'contact@example.org' });
    if (!result.ok) expect(result.hint).toContain('Domain-wide delegation');
  });

  it('reports Gmail send failures', async () => {
    fetchMock.mockResolvedValueOnce(tokenOk()).mockResolvedValueOnce(new Response('{"error":{"message":"Mail service not enabled"}}', { status: 400 }));
    const result = await sendTestEmail('admin@example.org', 'admin@example.org');
    expect(result).toMatchObject({ ok: false, stage: 'send' });
    if (!result.ok) expect(result.message).toContain('Mail service not enabled');
  });

  it('signs in with a valid JWT and sends to the admin', async () => {
    fetchMock.mockResolvedValueOnce(tokenOk()).mockResolvedValueOnce(new Response('{"id":"m1"}', { status: 200 }));
    const result = await sendTestEmail('admin@example.org', 'Admin <b>');
    expect(result).toEqual({ ok: true, from: 'contact@example.org', to: 'admin@example.org' });

    // Token request: a 3-part RS256 JWT for the sender mailbox
    const tokenBody = new URLSearchParams(String(fetchMock.mock.calls[0][1].body));
    const [header, payload, signature] = String(tokenBody.get('assertion')).split('.');
    expect(JSON.parse(Buffer.from(header, 'base64url').toString())).toEqual({ alg: 'RS256', typ: 'JWT' });
    expect(JSON.parse(Buffer.from(payload, 'base64url').toString())).toMatchObject({ sub: 'contact@example.org' });
    expect(signature.length).toBeGreaterThan(100);

    // Send request: correct headers, UTF-8 encoded subject, escaped name
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe('Bearer token-123');
    const raw = Buffer.from(JSON.parse(String(fetchMock.mock.calls[1][1].body)).raw, 'base64url').toString();
    expect(raw).toContain('To: admin@example.org');
    expect(raw).toMatch(/^Subject: =\?UTF-8\?B\?/m);
    expect(raw).toContain('Admin &lt;b&gt;');
  });
});

describe('sender per purpose', () => {
  it('signs in as and sends from the purpose address, with the org name', async () => {
    fetchMock.mockResolvedValueOnce(tokenOk()).mockResolvedValueOnce(new Response('{"id":"m1"}', { status: 200 }));
    const result = await sendTestEmail('admin@example.org', 'admin@example.org', { purpose: 'registrations' });
    expect(result).toMatchObject({ ok: true, from: 'registrations@example.org' });

    const assertion = String(new URLSearchParams(String(fetchMock.mock.calls[0][1].body)).get('assertion'));
    expect(JSON.parse(Buffer.from(assertion.split('.')[1], 'base64url').toString())).toMatchObject({ sub: 'registrations@example.org' });
    const raw = Buffer.from(JSON.parse(String(fetchMock.mock.calls[1][1].body)).raw, 'base64url').toString();
    expect(raw).toContain('From: Ambedkarite Buddhist Community <registrations@example.org>');
  });

  it('names the address in the hint when Google refuses it', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{"error":"invalid_grant","error_description":"Invalid email or User ID"}', { status: 400 }));
    const result = await sendTestEmail('admin@example.org', 'admin@example.org', { purpose: 'registrations' });
    expect(result).toMatchObject({ ok: false, stage: 'token', from: 'registrations@example.org' });
    if (!result.ok) expect(result.hint).toContain('registrations@example.org is a real mailbox');
  });
});

describe('message headers', () => {
  it('strips line breaks from subjects and sends to several recipients', async () => {
    const { sendEmail } = await import('./email');
    fetchMock.mockResolvedValueOnce(tokenOk()).mockResolvedValueOnce(new Response('{"id":"m1"}', { status: 200 }));
    await sendEmail('registrations', { to: ['a@example.org', 'b@example.org'], subject: 'Hi\r\nBcc: victim@example.org', html: '<p>x</p>' });
    const raw = Buffer.from(JSON.parse(String(fetchMock.mock.calls[1][1].body)).raw, 'base64url').toString();
    expect(raw).toContain('To: a@example.org, b@example.org');
    expect(raw).toContain('Subject: Hi Bcc: victim@example.org');
    expect(raw).not.toMatch(/^Bcc:/m);
  });
});
