-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "closed_at" TIMESTAMP(3),
ADD COLUMN     "resolution_confirmation_requested_at" TIMESTAMP(3),
ADD COLUMN     "resolved_at" TIMESTAMP(3);
