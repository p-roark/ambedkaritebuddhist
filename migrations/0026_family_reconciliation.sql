-- Add family reconciliation fields to FamilyMember table
ALTER TABLE "FamilyMember" ADD COLUMN "email" TEXT;
ALTER TABLE "FamilyMember" ADD COLUMN "inviteCode" TEXT;
ALTER TABLE "FamilyMember" ADD COLUMN "inviteStatus" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "FamilyMember" ADD COLUMN "inviteExpiresAt" TEXT;
ALTER TABLE "FamilyMember" ADD COLUMN "linkedUserId" TEXT REFERENCES "User"("id") ON DELETE SET NULL;

CREATE UNIQUE INDEX "FamilyMember_inviteCode_key" ON "FamilyMember"("inviteCode");
CREATE INDEX "FamilyMember_email_idx" ON "FamilyMember"("email");
