-- Quran Feham is deliberately light-first. SYSTEM was the previous default and
-- caused the app to change appearance without an in-product choice.
UPDATE "user_preferences"
SET "theme" = 'LIGHT'
WHERE "theme" = 'SYSTEM';

ALTER TABLE "user_preferences"
ALTER COLUMN "theme" SET DEFAULT 'LIGHT';
