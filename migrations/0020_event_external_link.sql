-- Add optional external link to events (NULL = no external link)
ALTER TABLE "Event" ADD COLUMN "externalLink" text;
