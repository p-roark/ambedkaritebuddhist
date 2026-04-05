-- Add paidAmount column to track actual money received (separate from totalAmount which is what is owed)
ALTER TABLE "EventRegistration" ADD COLUMN "paidAmount" integer NOT NULL DEFAULT 0;
