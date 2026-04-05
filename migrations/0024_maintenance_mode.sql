ALTER TABLE "OrganizationSettings" ADD COLUMN "maintenanceMode" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "OrganizationSettings" ADD COLUMN "maintenanceMessage" TEXT;
