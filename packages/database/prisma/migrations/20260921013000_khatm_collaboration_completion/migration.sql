CREATE TYPE "KhatmRecurrence" AS ENUM ('NONE', 'WEEKLY', 'MONTHLY');
CREATE TYPE "KhatmReminderCadence" AS ENUM ('NONE', 'DAILY', 'DEADLINE_3_DAYS', 'DEADLINE_1_DAY');
CREATE TYPE "KhatmReminderStatus" AS ENUM ('PENDING', 'SENT', 'CANCELLED', 'FAILED');
CREATE TYPE "KhatmActivityType" AS ENUM (
  'ROOM_CREATED', 'ROOM_UPDATED', 'MEMBER_JOINED', 'MEMBER_REMOVED', 'INVITE_ROTATED',
  'PARA_CLAIMED', 'PARA_READING', 'PARA_COMPLETED', 'PARA_RELEASED', 'PARA_REASSIGNED',
  'COMPLETION_REOPENED', 'CAMPAIGN_STARTED', 'CAMPAIGN_COMPLETED', 'CAMPAIGN_CANCELLED',
  'REMINDER_SCHEDULED', 'REMINDER_CANCELLED'
);

ALTER TABLE "khatm_rooms"
  ADD COLUMN "join_code" CHAR(8),
  ADD COLUMN "recurrence" "KhatmRecurrence" NOT NULL DEFAULT 'NONE',
  ADD COLUMN "max_active_paras_per_member" SMALLINT NOT NULL DEFAULT 2,
  ADD COLUMN "reminder_cadence" "KhatmReminderCadence" NOT NULL DEFAULT 'NONE';

-- Existing rooms receive a stable, non-ambiguous human code derived from their
-- already-random secure token. The loop deterministically resolves the unlikely
-- event of an eight-character collision before the unique index is installed.
DO $$
DECLARE
  room_row RECORD;
  candidate CHAR(8);
  attempt INTEGER;
BEGIN
  FOR room_row IN SELECT "id", "invite_code" FROM "khatm_rooms" ORDER BY "id" LOOP
    attempt := 0;
    LOOP
      candidate := UPPER(SUBSTRING(
        TRANSLATE(MD5(room_row."invite_code" || ':' || attempt::text), '01', 'YZ')
        FROM 1 FOR 8
      ));
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM "khatm_rooms" WHERE "join_code" = candidate
      );
      attempt := attempt + 1;
    END LOOP;
    UPDATE "khatm_rooms" SET "join_code" = candidate WHERE "id" = room_row."id";
  END LOOP;
END $$;

ALTER TABLE "khatm_rooms"
  ALTER COLUMN "join_code" SET NOT NULL,
  ADD CONSTRAINT "khatm_rooms_max_active_paras_check"
    CHECK ("max_active_paras_per_member" BETWEEN 1 AND 30);

CREATE UNIQUE INDEX "khatm_rooms_join_code_key" ON "khatm_rooms"("join_code");

ALTER TABLE "khatm_campaigns"
  ADD COLUMN "ended_at" TIMESTAMPTZ(3);

ALTER TABLE "khatm_para_slots"
  ADD COLUMN "assigned_by_user_id" UUID,
  ADD COLUMN "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "khatm_para_slots_assigned_by_user_id_idx"
  ON "khatm_para_slots"("assigned_by_user_id");

ALTER TABLE "khatm_para_slots"
  ADD CONSTRAINT "khatm_para_slots_assigned_by_user_id_fkey"
  FOREIGN KEY ("assigned_by_user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "khatm_reminders" (
  "id" UUID NOT NULL,
  "room_id" UUID NOT NULL,
  "campaign_id" UUID,
  "created_by_user_id" UUID NOT NULL,
  "scheduled_for" TIMESTAMPTZ(3) NOT NULL,
  "message" VARCHAR(280) NOT NULL,
  "status" "KhatmReminderStatus" NOT NULL DEFAULT 'PENDING',
  "sent_at" TIMESTAMPTZ(3),
  "cancelled_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "khatm_reminders_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "khatm_reminders_state_check" CHECK (
    ("status" = 'PENDING' AND "sent_at" IS NULL AND "cancelled_at" IS NULL)
    OR ("status" = 'SENT' AND "sent_at" IS NOT NULL AND "cancelled_at" IS NULL)
    OR ("status" = 'CANCELLED' AND "cancelled_at" IS NOT NULL AND "sent_at" IS NULL)
    OR ("status" = 'FAILED' AND "sent_at" IS NULL AND "cancelled_at" IS NULL)
  )
);

CREATE INDEX "khatm_reminders_room_id_scheduled_for_idx"
  ON "khatm_reminders"("room_id", "scheduled_for" ASC);
CREATE INDEX "khatm_reminders_status_scheduled_for_idx"
  ON "khatm_reminders"("status", "scheduled_for" ASC);

ALTER TABLE "khatm_reminders"
  ADD CONSTRAINT "khatm_reminders_room_id_fkey"
  FOREIGN KEY ("room_id") REFERENCES "khatm_rooms"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "khatm_reminders"
  ADD CONSTRAINT "khatm_reminders_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "khatm_campaigns"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "khatm_reminders"
  ADD CONSTRAINT "khatm_reminders_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "khatm_activities" (
  "id" UUID NOT NULL,
  "room_id" UUID NOT NULL,
  "campaign_id" UUID,
  "slot_id" UUID,
  "actor_user_id" UUID,
  "target_user_id" UUID,
  "type" "KhatmActivityType" NOT NULL,
  "khatm_number" SMALLINT,
  "juz_number" SMALLINT,
  "occurred_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "khatm_activities_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "khatm_activities_khatm_number_check"
    CHECK ("khatm_number" IS NULL OR "khatm_number" BETWEEN 1 AND 10),
  CONSTRAINT "khatm_activities_juz_number_check"
    CHECK ("juz_number" IS NULL OR "juz_number" BETWEEN 1 AND 30)
);

CREATE INDEX "khatm_activities_room_id_occurred_at_idx"
  ON "khatm_activities"("room_id", "occurred_at" DESC);
CREATE INDEX "khatm_activities_campaign_id_occurred_at_idx"
  ON "khatm_activities"("campaign_id", "occurred_at" DESC);

ALTER TABLE "khatm_activities"
  ADD CONSTRAINT "khatm_activities_room_id_fkey"
  FOREIGN KEY ("room_id") REFERENCES "khatm_rooms"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "khatm_activities"
  ADD CONSTRAINT "khatm_activities_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "khatm_campaigns"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "khatm_activities"
  ADD CONSTRAINT "khatm_activities_slot_id_fkey"
  FOREIGN KEY ("slot_id") REFERENCES "khatm_para_slots"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "khatm_activities"
  ADD CONSTRAINT "khatm_activities_actor_user_id_fkey"
  FOREIGN KEY ("actor_user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
