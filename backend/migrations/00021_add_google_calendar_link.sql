BEGIN;

ALTER TABLE users ADD COLUMN google_calendar_link TEXT;

COMMIT;
