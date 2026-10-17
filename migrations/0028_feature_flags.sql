-- Admin-controlled feature switches (Dashboard → Features).
-- Rows exist only for switches an admin has changed; others use the
-- defaults defined in src/lib/feature-flags.ts.
CREATE TABLE "FeatureFlag" (
  "key"       TEXT PRIMARY KEY NOT NULL,
  "enabled"   INTEGER NOT NULL,
  "updatedBy" TEXT,
  "updatedAt" TEXT NOT NULL
);
