-- Registration form: age confirmation (required) and board/committee interest (optional)
ALTER TABLE "User" ADD COLUMN "ageConfirmedAt" TEXT;
ALTER TABLE "User" ADD COLUMN "boardInterest" INTEGER NOT NULL DEFAULT 0;
