-- AlterTable
ALTER TABLE "User" ADD COLUMN     "invited_by_id" TEXT,
ADD COLUMN     "last_seen_at" TIMESTAMP(3),
ALTER COLUMN "password_hash" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
