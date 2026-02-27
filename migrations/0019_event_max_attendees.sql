-- Add optional maxAttendees cap to events (NULL = no limit)
ALTER TABLE "Event" ADD COLUMN "maxAttendees" integer;
