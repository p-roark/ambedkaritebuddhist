ALTER TABLE "Event" ADD COLUMN "time" TEXT NOT NULL DEFAULT '18:00';
ALTER TABLE "Event" ADD COLUMN "eventType" TEXT NOT NULL DEFAULT 'General';
ALTER TABLE "Event" ADD COLUMN "isPaid" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN "adultPrice" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Event" ADD COLUMN "childPrice" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "EventRegistration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "volunteering" BOOLEAN NOT NULL DEFAULT false,
    "includeFamily" BOOLEAN NOT NULL DEFAULT false,
    "adultsCount" INTEGER NOT NULL DEFAULT 1,
    "childrenCount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'Unpaid',
    "registrationStatus" TEXT NOT NULL DEFAULT 'Pending Registration',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE,
    CONSTRAINT "EventRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

CREATE INDEX "EventRegistration_event_idx" ON "EventRegistration"("eventId");
CREATE INDEX "EventRegistration_user_idx" ON "EventRegistration"("userId");
CREATE UNIQUE INDEX "EventRegistration_event_user_key" ON "EventRegistration"("eventId", "userId");
