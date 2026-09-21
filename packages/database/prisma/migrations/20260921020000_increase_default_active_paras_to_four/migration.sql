-- Alter default max active paras per member from 2 to 4
ALTER TABLE "khatm_rooms" ALTER COLUMN "max_active_paras_per_member" SET DEFAULT 4;

-- Upgrade existing rooms created with default 2 to 4
UPDATE "khatm_rooms"
SET "max_active_paras_per_member" = 4
WHERE "max_active_paras_per_member" = 2;
