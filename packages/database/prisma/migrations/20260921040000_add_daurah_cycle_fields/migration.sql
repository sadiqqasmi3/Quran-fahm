-- AlterEnum
ALTER TYPE "KhatmRecurrence" ADD VALUE IF NOT EXISTS 'BIWEEKLY';
ALTER TYPE "KhatmRecurrence" ADD VALUE IF NOT EXISTS 'THREE_DAYS';

-- AlterTable khatm_rooms
ALTER TABLE "khatm_rooms" ADD COLUMN IF NOT EXISTS "start_date" TIMESTAMPTZ(3);
ALTER TABLE "khatm_rooms" ADD COLUMN IF NOT EXISTS "auto_restart_on_complete" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable khatm_campaigns
ALTER TABLE "khatm_campaigns" ADD COLUMN IF NOT EXISTS "start_date" TIMESTAMPTZ(3);
