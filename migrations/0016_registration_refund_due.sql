-- Add refundDue column to track overpayment when admin reduces a confirmed registration
ALTER TABLE "EventRegistration" ADD COLUMN "refundDue" integer NOT NULL DEFAULT 0;
