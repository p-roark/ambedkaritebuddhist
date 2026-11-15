// @vitest-environment node
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestDb, type TestSqlite } from '@/test/sqlite-db';

const state = vi.hoisted(() => ({
  sqlite: null as unknown as TestSqlite,
  db: null as unknown,
  role: 'ADMIN',
  configured: true,
}));

vi.mock('@/db', () => ({ getDb: () => state.db }));
vi.mock('@/lib/auth', () => ({
  auth: async () => ({ user: { email: 'admin@example.com', role: state.role, name: 'Admin', image: null } }),
}));
// Capture emails instead of calling Gmail
const sendMock = vi.hoisted(() => vi.fn<[unknown, { to: string; subject: string; html: string }], Promise<boolean>>(async () => true));
vi.mock('@/lib/email', () => ({ sendEmailAs: sendMock, isEmailConfigured: () => state.configured }));

const { GET: listEmails, POST: createEmail } = await import('./route');
const { POST: sendBatch } = await import('./[id]/send/route');
const { POST: retry } = await import('./[id]/retry/route');
const { GET: getEmail } = await import('./[id]/route');
const { POST: sendTest } = await import('./test/route');
const { GET: listTemplates, POST: createTemplate } = await import('../email-templates/route');
const { PUT: updateTemplate, DELETE: deleteTemplate } = await import('../email-templates/[id]/route');

const req = (body?: unknown) => new NextRequest('http://localhost/api/admin/member-emails', { method: 'POST', body: JSON.stringify(body ?? {}) });
const idParams = (id: string) => ({ params: Promise.resolve({ id }) });
const json = async <T = Record<string, unknown>>(res: Response) => (await res.json()) as T;
type Progress = { total: number; sent: number; failed: number; pending: number };

function seedMember(id: string, name: string, email: string, status = 'active') {
  state.sqlite
    .prepare('INSERT INTO "User" (id, name, email, passwordHash, role, status, referredBy, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, name, email, '', 'MEMBER', status, 'BHIM-ABC-1234', '2026-10-01', '2026-10-01');
}

const message = { subject: 'Election news for {{first_name}}', body: 'Jai Bhim {{first_name}},\n\nThe election is on [DATE].' };

beforeEach(() => {
  const { sqlite, db } = createTestDb();
  state.sqlite = sqlite;
  state.db = db;
  state.role = 'ADMIN';
  state.configured = true;
  sendMock.mockReset();
  sendMock.mockImplementation(async () => true);
});

describe('templates', () => {
  it('comes with four editable starter templates', async () => {
    const { templates } = await json<{ templates: Array<{ id: string; name: string }> }>(await listTemplates(req()));
    expect(templates.map((t) => t.name).sort()).toEqual(
      ['Board election announcement', 'Community update', 'Event invitation', 'Notice of annual general meeting'],
    );
  });

  it('adds, edits and deletes templates', async () => {
    const created = await createTemplate(req({ name: 'Volunteer call', subject: 'Help needed', body: 'Hi {{first_name}}' }));
    expect(created.status).toBe(201);
    const { template } = await json<{ template: { id: string } }>(created);

    const updated = await updateTemplate(req({ name: 'Volunteer call', subject: 'Volunteers needed', body: 'Hi {{name}}' }), idParams(template.id));
    expect((await json<{ template: { subject: string; updatedBy: string } }>(updated)).template).toMatchObject({ subject: 'Volunteers needed', updatedBy: 'admin@example.com' });

    expect((await updateTemplate(req({ name: 'x', subject: 'Hi {{phone}}', body: 'b' }), idParams(template.id))).status).toBe(400);
    expect((await deleteTemplate(req(), idParams(template.id))).status).toBe(200);
    expect((await deleteTemplate(req(), idParams(template.id))).status).toBe(404);
  });
});

describe('sending to members', () => {
  it('includes only active members, then sends in batches, personalised', async () => {
    for (let i = 0; i < 20; i++) seedMember(`m${i}`, `Member${i} Test`, `m${i}@example.org`);
    seedMember('gone', 'Gone Member', 'gone@example.org', 'inactive');
    const created = await createEmail(req({ ...message, userIds: [...Array.from({ length: 20 }, (_, i) => `m${i}`), 'gone', 'nobody'] }));
    expect(created.status).toBe(201);
    const { id, recipientCount } = await json<{ id: string; recipientCount: number }>(created);
    expect(recipientCount).toBe(20);

    const first = await json<{ progress: Progress }>(await sendBatch(req(), idParams(id)));
    expect(first.progress).toEqual({ total: 20, sent: 15, failed: 0, pending: 5 });
    const second = await json<{ progress: Progress }>(await sendBatch(req(), idParams(id)));
    expect(second.progress).toEqual({ total: 20, sent: 20, failed: 0, pending: 0 });

    expect(sendMock).toHaveBeenCalledTimes(20);
    const toM3 = sendMock.mock.calls.find(([, m]) => m.to === 'm3@example.org')?.[1];
    expect(toM3?.subject).toBe('Election news for Member3');
    expect(toM3?.html).toContain('Jai Bhim Member3,');
    expect(sendMock.mock.calls.some(([, m]) => m.to === 'gone@example.org')).toBe(false);

    const { emails } = await json<{ emails: Array<{ subject: string; sent: number; total: number }> }>(await listEmails(req()));
    expect(emails[0]).toMatchObject({ subject: message.subject, sent: 20, total: 20 });
  });

  it('records failures and can retry them', async () => {
    seedMember('a', 'Asha', 'a@example.org');
    seedMember('b', 'Bhim', 'b@example.org');
    const { id } = await json<{ id: string }>(await createEmail(req({ ...message, userIds: ['a', 'b'] })));
    sendMock.mockImplementation(async (_s, m) => {
      if (m.to === 'b@example.org') throw new Error('Gmail API send failed: mailbox full');
      return true;
    });
    expect((await json<{ progress: Progress }>(await sendBatch(req(), idParams(id)))).progress).toMatchObject({ sent: 1, failed: 1, pending: 0 });
    const detail = await json<{ failed: Array<{ email: string; error: string }> }>(await getEmail(req(), idParams(id)));
    expect(detail.failed).toEqual([{ email: 'b@example.org', name: 'Bhim', error: expect.stringContaining('mailbox full') }]);

    sendMock.mockImplementation(async () => true);
    expect(await json(await retry(req(), idParams(id)))).toEqual({ requeued: 1 });
    expect((await json<{ progress: Progress }>(await sendBatch(req(), idParams(id)))).progress).toMatchObject({ sent: 2, failed: 0, pending: 0 });
  });

  it('never sends twice to the same member when two tabs send at once', async () => {
    for (let i = 0; i < 20; i++) seedMember(`m${i}`, `Member ${i}`, `m${i}@example.org`);
    const { id } = await json<{ id: string }>(await createEmail(req({ ...message, userIds: Array.from({ length: 20 }, (_, i) => `m${i}`) })));
    // Straight to the sending logic: the test runner can't fake sign-in for simultaneous requests
    const { sendNextBatch } = await import('@/lib/member-emails-server');
    await Promise.all([sendNextBatch(id), sendNextBatch(id), sendNextBatch(id)]);
    const recipients = sendMock.mock.calls.map(([, m]) => m.to);
    expect(new Set(recipients).size).toBe(recipients.length);
    expect(recipients).toHaveLength(20);
  });

  it('refuses when email is not set up, with nothing marked as sent', async () => {
    seedMember('a', 'Asha', 'a@example.org');
    const { id } = await json<{ id: string }>(await createEmail(req({ ...message, userIds: ['a'] })));
    state.configured = false;
    expect((await sendBatch(req(), idParams(id))).status).toBe(503);
    state.configured = true;
    expect((await json<{ progress: Progress }>(await getEmail(req(), idParams(id)))).progress).toMatchObject({ pending: 1, sent: 0 });
  });

  it('validates the email and the recipients', async () => {
    seedMember('gone', 'Gone', 'gone@example.org', 'inactive');
    expect((await createEmail(req({ ...message, userIds: [] }))).status).toBe(400);
    expect((await createEmail(req({ subject: '', body: 'x', userIds: ['gone'] }))).status).toBe(400);
    expect((await createEmail(req({ ...message, userIds: ['gone'] }))).status).toBe(400);
  });

  it('sends a test copy to the admin only', async () => {
    seedMember('admin', 'Pankaj Patil', 'admin@example.com');
    const res = await sendTest(req(message));
    expect(await json(res)).toEqual({ sentTo: 'admin@example.com' });
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock.mock.calls[0][1]).toMatchObject({ to: 'admin@example.com', subject: '[Test] Election news for Pankaj' });
  });

  it('is admin-only', async () => {
    state.role = 'MEMBER';
    expect((await createEmail(req({ ...message, userIds: ['a'] }))).status).toBe(403);
    expect((await sendBatch(req(), idParams('x'))).status).toBe(403);
    expect((await listTemplates(req())).status).toBe(403);
    expect((await sendTest(req(message))).status).toBe(403);
  });
});
