-- Add member status and activation request tracking to User table
ALTER TABLE "User" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "User" ADD COLUMN "activationRequestCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "activationRequestStatus" TEXT NOT NULL DEFAULT 'none';

-- Add type and userId to ContactMessage for activation request tracking
ALTER TABLE "ContactMessage" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'CONTACT';
ALTER TABLE "ContactMessage" ADD COLUMN "userId" TEXT REFERENCES "User"("id");

CREATE INDEX "ContactMessage_type_idx" ON "ContactMessage"("type");
