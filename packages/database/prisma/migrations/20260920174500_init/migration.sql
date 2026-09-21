-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('LEARNER', 'REVIEWER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('en', 'ur');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('VERIFY_EMAIL', 'PASSWORD_RESET', 'SIGN_IN');

-- CreateEnum
CREATE TYPE "ThemePreference" AS ENUM ('SYSTEM', 'LIGHT', 'DARK');

-- CreateEnum
CREATE TYPE "ContentReleaseStatus" AS ENUM ('IMPORTED', 'REVIEWED', 'ACTIVE', 'RETIRED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "password_hash" TEXT,
    "display_name" VARCHAR(80),
    "locale" "Locale" NOT NULL DEFAULT 'ur',
    "role" "UserRole" NOT NULL DEFAULT 'LEARNER',
    "email_verified_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_family_id" UUID NOT NULL,
    "refresh_token_hash" CHAR(64) NOT NULL,
    "previous_refresh_token_hash" CHAR(64),
    "rotated_at" TIMESTAMPTZ(3),
    "device_name" VARCHAR(120) NOT NULL,
    "user_agent" VARCHAR(512),
    "ip_address" INET,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "revoked_at" TIMESTAMPTZ(3),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_challenges" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "email" VARCHAR(254) NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "code_hash" CHAR(64) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "consumed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "user_id" UUID NOT NULL,
    "interface_locale" "Locale" NOT NULL DEFAULT 'ur',
    "translation_edition_id" VARCHAR(120) NOT NULL DEFAULT 'ur.jalandhry',
    "recitation_edition_id" VARCHAR(120) NOT NULL DEFAULT 'ar.alafasy',
    "quran_script" VARCHAR(40) NOT NULL DEFAULT 'uthmani',
    "theme" "ThemePreference" NOT NULL DEFAULT 'SYSTEM',
    "arabic_scale" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "daily_goal_minutes" INTEGER NOT NULL DEFAULT 10,
    "learning_goal" VARCHAR(80),
    "reminders_enabled" BOOLEAN NOT NULL DEFAULT false,
    "onboarding_completed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "reading_positions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "surah_number" SMALLINT NOT NULL,
    "ayah_number" INTEGER NOT NULL,
    "mode" VARCHAR(20) NOT NULL DEFAULT 'read',
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "reading_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmarks" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "surah_number" SMALLINT NOT NULL,
    "ayah_number" INTEGER NOT NULL,
    "note" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_events" (
    "id" UUID NOT NULL,
    "idempotency_key" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "event_type" VARCHAR(60) NOT NULL,
    "learning_item_id" VARCHAR(180) NOT NULL,
    "mastery_dimension" VARCHAR(30),
    "rating" VARCHAR(30),
    "payload" JSONB NOT NULL DEFAULT '{}',
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "recorded_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content_release_id" VARCHAR(120) NOT NULL,

    CONSTRAINT "learning_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_releases" (
    "id" VARCHAR(120) NOT NULL,
    "source_id" VARCHAR(120) NOT NULL,
    "provider" VARCHAR(160) NOT NULL,
    "edition" VARCHAR(160) NOT NULL,
    "upstream_version" VARCHAR(160) NOT NULL,
    "upstream_commit" VARCHAR(160),
    "sha256" CHAR(64) NOT NULL,
    "license" VARCHAR(240) NOT NULL,
    "retrieved_at" TIMESTAMPTZ(3) NOT NULL,
    "manifest" JSONB NOT NULL DEFAULT '{}',
    "status" "ContentReleaseStatus" NOT NULL DEFAULT 'IMPORTED',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_releases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refresh_token_hash_key" ON "sessions"("refresh_token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_previous_refresh_token_hash_key" ON "sessions"("previous_refresh_token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_revoked_at_idx" ON "sessions"("user_id", "revoked_at");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "otp_challenges_email_purpose_created_at_idx" ON "otp_challenges"("email", "purpose", "created_at" DESC);

-- CreateIndex
CREATE INDEX "otp_challenges_expires_at_idx" ON "otp_challenges"("expires_at");

-- CreateIndex
CREATE INDEX "reading_positions_user_id_updated_at_idx" ON "reading_positions"("user_id", "updated_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "reading_positions_user_id_surah_number_key" ON "reading_positions"("user_id", "surah_number");

-- CreateIndex
CREATE INDEX "bookmarks_user_id_created_at_idx" ON "bookmarks"("user_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_user_id_surah_number_ayah_number_key" ON "bookmarks"("user_id", "surah_number", "ayah_number");

-- CreateIndex
CREATE UNIQUE INDEX "learning_events_idempotency_key_key" ON "learning_events"("idempotency_key");

-- CreateIndex
CREATE INDEX "learning_events_user_id_occurred_at_idx" ON "learning_events"("user_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "learning_events_content_release_id_idx" ON "learning_events"("content_release_id");

-- CreateIndex
CREATE INDEX "content_releases_source_id_status_idx" ON "content_releases"("source_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "content_releases_source_id_sha256_key" ON "content_releases"("source_id", "sha256");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_challenges" ADD CONSTRAINT "otp_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_positions" ADD CONSTRAINT "reading_positions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_content_release_id_fkey" FOREIGN KEY ("content_release_id") REFERENCES "content_releases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

