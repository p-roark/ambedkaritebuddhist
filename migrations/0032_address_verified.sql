-- When the member's street address was confirmed by the address search
-- (Government of Canada Geolocator). NULL = typed by hand / not verified.
ALTER TABLE "User" ADD COLUMN "addressVerifiedAt" TEXT;
