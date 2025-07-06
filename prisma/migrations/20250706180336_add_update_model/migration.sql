-- AlterTable
ALTER TABLE "File" ADD COLUMN     "update_id" TEXT;

-- CreateTable
CREATE TABLE "Update" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "portal_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Update_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Update" ADD CONSTRAINT "Update_portal_id_fkey" FOREIGN KEY ("portal_id") REFERENCES "Portal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Update" ADD CONSTRAINT "Update_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_update_id_fkey" FOREIGN KEY ("update_id") REFERENCES "Update"("id") ON DELETE SET NULL ON UPDATE CASCADE;
