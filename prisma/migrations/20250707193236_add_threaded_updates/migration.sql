-- AlterTable
ALTER TABLE "Update" ADD COLUMN     "parent_update_id" TEXT;

-- AddForeignKey
ALTER TABLE "Update" ADD CONSTRAINT "Update_parent_update_id_fkey" FOREIGN KEY ("parent_update_id") REFERENCES "Update"("id") ON DELETE CASCADE ON UPDATE CASCADE;
