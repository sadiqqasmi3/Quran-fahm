CREATE TYPE "KhatmRoomMemberRole" AS ENUM ('OWNER', 'MEMBER');
CREATE TYPE "KhatmCampaignStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE "KhatmParaStatus" AS ENUM ('AVAILABLE', 'CLAIMED', 'READING', 'COMPLETED');

CREATE TABLE "khatm_rooms" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "intention" VARCHAR(300),
    "target_khatms" SMALLINT NOT NULL,
    "deadline" TIMESTAMPTZ(3),
    "invite_code" VARCHAR(64) NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "khatm_rooms_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "khatm_rooms_target_khatms_check" CHECK ("target_khatms" BETWEEN 1 AND 10)
);

CREATE TABLE "khatm_room_members" (
    "room_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "KhatmRoomMemberRole" NOT NULL DEFAULT 'MEMBER',
    "joined_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "khatm_room_members_pkey" PRIMARY KEY ("room_id", "user_id")
);

CREATE TABLE "khatm_campaigns" (
    "id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "number" SMALLINT NOT NULL,
    "status" "KhatmCampaignStatus" NOT NULL DEFAULT 'ACTIVE',
    "target_khatms" SMALLINT NOT NULL,
    "deadline" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "khatm_campaigns_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "khatm_campaigns_number_check" CHECK ("number" > 0),
    CONSTRAINT "khatm_campaigns_target_khatms_check" CHECK ("target_khatms" BETWEEN 1 AND 10)
);

CREATE TABLE "khatm_para_slots" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "khatm_number" SMALLINT NOT NULL,
    "juz_number" SMALLINT NOT NULL,
    "status" "KhatmParaStatus" NOT NULL DEFAULT 'AVAILABLE',
    "claimed_by_user_id" UUID,
    "claimed_at" TIMESTAMPTZ(3),
    "reading_started_at" TIMESTAMPTZ(3),
    "completed_at" TIMESTAMPTZ(3),
    CONSTRAINT "khatm_para_slots_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "khatm_para_slots_khatm_number_check" CHECK ("khatm_number" BETWEEN 1 AND 10),
    CONSTRAINT "khatm_para_slots_juz_number_check" CHECK ("juz_number" BETWEEN 1 AND 30),
    CONSTRAINT "khatm_para_slots_state_check" CHECK (
      ("status" = 'AVAILABLE' AND "claimed_by_user_id" IS NULL AND "claimed_at" IS NULL AND "reading_started_at" IS NULL AND "completed_at" IS NULL)
      OR ("status" = 'CLAIMED' AND "claimed_by_user_id" IS NOT NULL AND "claimed_at" IS NOT NULL AND "reading_started_at" IS NULL AND "completed_at" IS NULL)
      OR ("status" = 'READING' AND "claimed_by_user_id" IS NOT NULL AND "claimed_at" IS NOT NULL AND "reading_started_at" IS NOT NULL AND "completed_at" IS NULL)
      OR ("status" = 'COMPLETED' AND "claimed_by_user_id" IS NOT NULL AND "claimed_at" IS NOT NULL AND "completed_at" IS NOT NULL)
    )
);

CREATE UNIQUE INDEX "khatm_rooms_invite_code_key" ON "khatm_rooms"("invite_code");
CREATE INDEX "khatm_rooms_owner_user_id_idx" ON "khatm_rooms"("owner_user_id");
CREATE INDEX "khatm_room_members_user_id_joined_at_idx" ON "khatm_room_members"("user_id", "joined_at" DESC);
CREATE UNIQUE INDEX "khatm_campaigns_room_id_number_key" ON "khatm_campaigns"("room_id", "number");
CREATE INDEX "khatm_campaigns_room_id_status_idx" ON "khatm_campaigns"("room_id", "status");
CREATE UNIQUE INDEX "khatm_campaigns_one_active_per_room_idx" ON "khatm_campaigns"("room_id") WHERE "status" = 'ACTIVE';
CREATE UNIQUE INDEX "khatm_para_slots_campaign_id_khatm_number_juz_number_key" ON "khatm_para_slots"("campaign_id", "khatm_number", "juz_number");
CREATE INDEX "khatm_para_slots_campaign_id_status_idx" ON "khatm_para_slots"("campaign_id", "status");
CREATE INDEX "khatm_para_slots_claimed_by_user_id_status_idx" ON "khatm_para_slots"("claimed_by_user_id", "status");

ALTER TABLE "khatm_rooms" ADD CONSTRAINT "khatm_rooms_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "khatm_room_members" ADD CONSTRAINT "khatm_room_members_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "khatm_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "khatm_room_members" ADD CONSTRAINT "khatm_room_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "khatm_campaigns" ADD CONSTRAINT "khatm_campaigns_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "khatm_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "khatm_para_slots" ADD CONSTRAINT "khatm_para_slots_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "khatm_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "khatm_para_slots" ADD CONSTRAINT "khatm_para_slots_claimed_by_user_id_fkey" FOREIGN KEY ("claimed_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
