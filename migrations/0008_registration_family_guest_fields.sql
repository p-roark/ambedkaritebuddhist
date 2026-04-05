ALTER TABLE "EventRegistration" ADD COLUMN "selectedFamilyMemberIds" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "EventRegistration" ADD COLUMN "nonMemberAdultGuests" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "EventRegistration" ADD COLUMN "nonMemberChildGuests" INTEGER NOT NULL DEFAULT 0;
