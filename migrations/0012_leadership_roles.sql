CREATE TABLE "LeadershipRole" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "roleName" TEXT NOT NULL,
  "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
  "updatedAt" TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX "LeadershipRole_displayOrder_idx" ON "LeadershipRole"("displayOrder");
