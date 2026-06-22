-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('pending', 'dismissed', 'blocked');

-- CreateEnum
CREATE TYPE "ModerationAction" AS ENUM ('dismiss', 'block_sender');

-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('received', 'processed', 'failed');

-- CreateTable
CREATE TABLE "moderation_queue" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "ticket_id" TEXT,
    "sender_uid" TEXT NOT NULL,
    "sender_name" TEXT NOT NULL,
    "message_content" TEXT NOT NULL,
    "flag_reason" TEXT NOT NULL,
    "flagged_at" TIMESTAMP(3) NOT NULL,
    "status" "ModerationStatus" NOT NULL DEFAULT 'pending',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "action" "ModerationAction",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_event_logs" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "WebhookStatus" NOT NULL DEFAULT 'received',
    "error_message" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "moderation_queue_status_idx" ON "moderation_queue"("status");

-- CreateIndex
CREATE INDEX "moderation_queue_flagged_at_idx" ON "moderation_queue"("flagged_at");

-- CreateIndex
CREATE INDEX "webhook_event_logs_event_type_idx" ON "webhook_event_logs"("event_type");

-- CreateIndex
CREATE INDEX "webhook_event_logs_status_idx" ON "webhook_event_logs"("status");

-- CreateIndex
CREATE INDEX "webhook_event_logs_created_at_idx" ON "webhook_event_logs"("created_at");
