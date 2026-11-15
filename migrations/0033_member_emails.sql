-- Dashboard → Email Members: editable templates and a log of emails sent to members.

CREATE TABLE "EmailTemplate" (
  "id"        TEXT PRIMARY KEY NOT NULL,
  "name"      TEXT NOT NULL,
  "subject"   TEXT NOT NULL,
  "body"      TEXT NOT NULL,
  "updatedBy" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

-- One row per email sent to a group of members
CREATE TABLE "MemberEmail" (
  "id"             TEXT PRIMARY KEY NOT NULL,
  "subject"        TEXT NOT NULL,
  "body"           TEXT NOT NULL,
  "templateId"     TEXT,
  "sentBy"         TEXT NOT NULL,
  "recipientCount" INTEGER NOT NULL,
  "createdAt"      TEXT NOT NULL
);

-- Each recipient's delivery status (pending | sent | failed); sending works
-- through pending rows in small batches, so it can resume if interrupted
CREATE TABLE "MemberEmailRecipient" (
  "emailId" TEXT NOT NULL REFERENCES "MemberEmail"("id") ON DELETE CASCADE,
  "userId"  TEXT,
  "email"   TEXT NOT NULL,
  "name"    TEXT NOT NULL,
  "status"  TEXT NOT NULL DEFAULT 'pending',
  "error"   TEXT,
  "sentAt"  TEXT,
  PRIMARY KEY ("emailId", "email")
);
CREATE INDEX "MemberEmailRecipient_status_idx" ON "MemberEmailRecipient"("emailId", "status");

-- Starter templates (admins can edit, add or delete them)
INSERT INTO "EmailTemplate" ("id", "name", "subject", "body", "updatedBy", "createdAt", "updatedAt") VALUES
  ('tpl-election', 'Board election announcement', '{{org_name}} Board of Directors election', 'Jai Bhim {{first_name}},

{{org_name}} will hold an election for its Board of Directors, and every member in good standing is invited to take part.

Nominations open: [DATE]
Nominations close: [DATE]
Election date: [DATE]
How to vote: [e.g. online ballot link sent separately, or in person at PLACE]

Positions open: [e.g. President, Secretary, Treasurer, Directors]

To nominate yourself or another member, reply to this email with the nominee''s name and the position. Nominees will be shared with all members before the election.

Thank you for helping shape the future of our community.

In the Dhamma,
[YOUR NAME], [ROLE]
{{org_name}}', NULL, '2026-11-15T00:00:00.000Z', '2026-11-15T00:00:00.000Z'),
  ('tpl-community-update', 'Community update', 'Community update from {{org_name}}', 'Jai Bhim {{first_name}},

Here''s what has been happening in our community:

• [UPDATE 1]
• [UPDATE 2]
• [UPDATE 3]

Coming up:

• [EVENT, DATE AND PLACE]

Thank you for being part of our sangha. If you have news to share or would like to help, just reply to this email.

In the Dhamma,
{{org_name}}', NULL, '2026-11-15T00:00:00.000Z', '2026-11-15T00:00:00.000Z'),
  ('tpl-event-invitation', 'Event invitation', 'You''re invited: [EVENT NAME]', 'Jai Bhim {{first_name}},

You and your family are warmly invited to [EVENT NAME].

Date: [DATE]
Time: [START TIME] – [END TIME]
Place: [ADDRESS]

[A FEW LINES ABOUT THE EVENT: programme, speakers, food, what to bring]

Please let us know if you can come: [RSVP LINK OR "reply to this email"]

We look forward to seeing you.

In the Dhamma,
{{org_name}}', NULL, '2026-11-15T00:00:00.000Z', '2026-11-15T00:00:00.000Z'),
  ('tpl-agm-notice', 'Notice of annual general meeting', 'Notice of Annual General Meeting – [DATE]', 'Dear {{name}},

Notice is hereby given that the Annual General Meeting of the members of {{org_name}} will be held on:

Date: [DATE]
Time: [TIME]
Place: [ADDRESS, OR ONLINE MEETING LINK]

Agenda:
1. Welcome and confirmation of quorum
2. Approval of the previous meeting''s minutes
3. President''s report
4. Financial statements and treasurer''s report
5. [ELECTION OF DIRECTORS / APPOINTMENT OF ACCOUNTANT]
6. Other business

Members in good standing are entitled to attend and vote. [PROXY OR ONLINE VOTING INSTRUCTIONS, IF ANY]

Questions or items for the agenda can be sent by replying to this email before [DATE].

Sincerely,
[YOUR NAME], Secretary
{{org_name}}', NULL, '2026-11-15T00:00:00.000Z', '2026-11-15T00:00:00.000Z');
