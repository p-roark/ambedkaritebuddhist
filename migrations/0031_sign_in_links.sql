-- One-time email sign-in links (Dashboard → Features → "Email sign-in link").
-- Only a SHA-256 hash of each link's token is stored; rows are deleted when
-- used and cleaned up after they expire.
CREATE TABLE "SignInLink" (
  "tokenHash" TEXT PRIMARY KEY NOT NULL,
  "email"     TEXT NOT NULL,
  "ip"        TEXT,
  "expiresAt" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL
);
CREATE INDEX "SignInLink_email_idx" ON "SignInLink"("email", "createdAt");
CREATE INDEX "SignInLink_ip_idx" ON "SignInLink"("ip", "createdAt");
