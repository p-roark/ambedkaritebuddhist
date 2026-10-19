// @vitest-environment node
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestDb, type TestSqlite } from '@/test/sqlite-db';

const state = vi.hoisted(() => ({
  sqlite: null as unknown as TestSqlite,
  db: null as unknown,
  sessionEmail: null as string | null,
}));

vi.mock('@/db', () => ({ getDb: () => state.db }));
// Capture emails instead of calling Gmail
const sendEmailMock = vi.hoisted(() => vi.fn(async () => true));
vi.mock('@/lib/email', () => ({ sendEmail: sendEmailMock }));
const backgroundTasks = vi.hoisted(() => [] as Promise<unknown>[]);
vi.mock('@/lib/background', () => ({
  runInBackground: (_label: string, task: Promise<unknown>) => void backgroundTasks.push(task),
}));
const settle = async () => {
  while (backgroundTasks.length) await Promise.allSettled(backgroundTasks.splice(0));
};
type SentEmail = [string, { to: string; replyTo?: string; subject: string; html: string }];
const sent = () => sendEmailMock.mock.calls as unknown as SentEmail[];
vi.mock('@/lib/auth', () => ({
  auth: async () => (state.sessionEmail ? { user: { email: state.sessionEmail, name: 'Test', role: 'MEMBER' } } : null),
}));

const { POST } = await import('./route');

const message = { name: 'Savitri Phule', email: 'typed@example.com', subject: 'Hello', message: 'Jai Bhim' };
const post = (body: unknown) =>
  POST(new NextRequest('http://localhost/api/contact/messages', { method: 'POST', body: JSON.stringify(body) }));
const saved = () =>
  state.sqlite.prepare('SELECT name, email, userId FROM "ContactMessage"').all() as Array<Record<string, unknown>>;

beforeEach(() => {
  const { sqlite, db } = createTestDb();
  state.sqlite = sqlite;
  state.db = db;
  state.sessionEmail = null;
  sendEmailMock.mockClear();
  backgroundTasks.length = 0;
  sqlite
    .prepare('INSERT INTO "User" (id, name, email, passwordHash, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run('u1', 'Savitri Phule', 'member@example.com', '', 'MEMBER', '2026-10-01', '2026-10-01');
});

describe('POST /api/contact/messages', () => {
  it('saves visitor messages with the email they typed', async () => {
    expect((await post(message)).status).toBe(201);
    expect(saved()).toEqual([{ name: 'Savitri Phule', email: 'typed@example.com', userId: null }]);
  });

  it("links a signed-in member's message to their account and sign-in email", async () => {
    state.sessionEmail = 'member@example.com';
    expect((await post(message)).status).toBe(201);
    expect(saved()).toEqual([{ name: 'Savitri Phule', email: 'member@example.com', userId: 'u1' }]);
  });

  it('still requires a name, subject and message', async () => {
    state.sessionEmail = 'member@example.com';
    expect((await post({ ...message, subject: '' })).status).toBe(400);
    expect(saved()).toEqual([]);
  });

  it('emails the Contact messages address with a link to the message', async () => {
    const res = await post({ ...message, subject: 'Hall <booking>', message: 'Line one\nLine <two>' });
    expect(res.status).toBe(201);
    await settle();

    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const [purpose, email] = sent()[0];
    expect(purpose).toBe('contact');
    // No Contact messages address set: the organization email
    const orgEmail = (state.sqlite.prepare('SELECT email FROM "OrganizationSettings" WHERE id = ?').get('main') as { email: string }).email;
    expect(email.to).toBe(orgEmail);
    expect(email.replyTo).toBe('typed@example.com');
    expect(email.subject).toBe('New message: Hall <booking>');
    const id = (state.sqlite.prepare('SELECT id FROM "ContactMessage"').get() as { id: string }).id;
    expect(email.html).toContain(`http://localhost/dashboard?tab=messages&amp;message=${id}`);
    expect(email.html).toContain('mailto:typed%40example.com?subject=Re%3A%20Hall%20%3Cbooking%3E');
    expect(email.html).toContain('Line &lt;two&gt;');
    expect(email.html).not.toContain('<booking>');
  });

  it('uses the Contact messages address when one is set', async () => {
    state.sqlite
      .prepare('INSERT INTO "EmailSender" (purpose, address, updatedBy, updatedAt) VALUES (?, ?, ?, ?)')
      .run('contact', 'contactus@example.org', 'admin@example.com', '2026-10-19');
    await post(message);
    await settle();
    expect(sent()[0][1].to).toBe('contactus@example.org');
  });

  it('limits messages from one email address', async () => {
    for (let i = 0; i < 5; i++) expect((await post(message)).status).toBe(201);
    expect((await post(message)).status).toBe(429);
    expect(saved()).toHaveLength(5);
  });

  it('saves but stops emailing when the form is flooded', async () => {
    for (let i = 0; i < 31; i++) {
      state.sqlite
        .prepare('INSERT INTO "ContactMessage" (id, name, email, subject, message, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(`old${i}`, 'X', `x${i}@example.com`, 'S', 'M', new Date().toISOString(), new Date().toISOString());
    }
    expect((await post(message)).status).toBe(201);
    await settle();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('rejects overly long messages', async () => {
    expect((await post({ ...message, message: 'x'.repeat(5001) })).status).toBe(400);
  });
});
