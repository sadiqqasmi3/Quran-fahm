-- Preserve every rotated refresh-token digest until the token family expires.
-- This makes replay detection independent of how many later rotations occurred.
CREATE TABLE "refresh_token_tombstones" (
    "token_hash" CHAR(64) NOT NULL,
    "session_id" UUID NOT NULL,
    "token_family_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_token_tombstones_pkey" PRIMARY KEY ("token_hash")
);

CREATE INDEX "refresh_token_tombstones_token_family_id_idx"
    ON "refresh_token_tombstones"("token_family_id");

CREATE INDEX "refresh_token_tombstones_expires_at_idx"
    ON "refresh_token_tombstones"("expires_at");

ALTER TABLE "refresh_token_tombstones"
    ADD CONSTRAINT "refresh_token_tombstones_session_id_fkey"
    FOREIGN KEY ("session_id") REFERENCES "sessions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
