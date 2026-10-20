-- Sender address per email purpose (Dashboard → Settings → Email).
-- Purposes without a row use the organization email (OrganizationSettings.email).
CREATE TABLE "EmailSender" (
  "purpose"   TEXT PRIMARY KEY NOT NULL,
  "address"   TEXT NOT NULL,
  "updatedBy" TEXT,
  "updatedAt" TEXT NOT NULL
);
