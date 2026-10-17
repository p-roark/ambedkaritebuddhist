-- Invite-link registration flow: mandatory registration form + disclaimer.
-- Existing members are intentionally NOT backfilled: everyone (except admins)
-- completes the registration form on their next sign-in.
ALTER TABLE "User" ADD COLUMN "residencyStatus" TEXT;
ALTER TABLE "User" ADD COLUMN "registrationCompletedAt" TEXT;
ALTER TABLE "User" ADD COLUMN "disclaimerAcceptedAt" TEXT;
ALTER TABLE "User" ADD COLUMN "disclaimerVersion" TEXT;
