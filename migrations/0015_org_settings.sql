-- Organization settings (singleton row)
CREATE TABLE IF NOT EXISTS "OrganizationSettings" (
  "id"           TEXT PRIMARY KEY,
  "orgName"      TEXT NOT NULL DEFAULT 'Ambedkarite Buddhist Organization Canada',
  "shortName"    TEXT NOT NULL DEFAULT 'ABC Canada',
  "email"        TEXT NOT NULL DEFAULT 'info@ambedkaritebuddhist.ca',
  "phone"        TEXT,
  "altPhone"     TEXT,
  "addressLine1" TEXT,
  "addressLine2" TEXT,
  "city"         TEXT,
  "province"     TEXT,
  "postalCode"   TEXT,
  "country"      TEXT NOT NULL DEFAULT 'Canada',
  "website"      TEXT,
  "description"  TEXT,
  "updatedAt"    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed the single settings row (no-op if it already exists)
INSERT OR IGNORE INTO "OrganizationSettings" ("id") VALUES ('main');
