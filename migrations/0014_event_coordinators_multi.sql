CREATE TABLE "EventCoordinator" (
  "eventId" TEXT NOT NULL REFERENCES "Event"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  PRIMARY KEY ("eventId", "userId")
);

CREATE INDEX "EventCoordinator_event_idx" ON "EventCoordinator"("eventId");
CREATE INDEX "EventCoordinator_user_idx" ON "EventCoordinator"("userId");

-- Migrate any existing single-coordinator data to the junction table
INSERT OR IGNORE INTO "EventCoordinator" ("eventId", "userId")
SELECT "id", "coordinatorId" FROM "Event" WHERE "coordinatorId" IS NOT NULL;

-- Drop the index before dropping the column (SQLite requirement)
DROP INDEX IF EXISTS "Event_coordinator_idx";

-- Drop the old single-coordinator column
ALTER TABLE "Event" DROP COLUMN "coordinatorId";
