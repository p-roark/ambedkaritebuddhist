ALTER TABLE "Event" ADD COLUMN "coordinatorId" TEXT REFERENCES "User"("id") ON DELETE SET NULL;
CREATE INDEX "Event_coordinator_idx" ON "Event"("coordinatorId");
