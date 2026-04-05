-- Add paymentHistory to store a log of payment and refund transactions with reference numbers
ALTER TABLE "EventRegistration" ADD COLUMN "paymentHistory" text NOT NULL DEFAULT '[]';
