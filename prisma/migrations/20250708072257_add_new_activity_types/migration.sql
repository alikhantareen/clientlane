-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityType" ADD VALUE 'update_created';
ALTER TYPE "ActivityType" ADD VALUE 'reply_created';
ALTER TYPE "ActivityType" ADD VALUE 'file_uploaded';
ALTER TYPE "ActivityType" ADD VALUE 'portal_created';
ALTER TYPE "ActivityType" ADD VALUE 'shared_link_created';
