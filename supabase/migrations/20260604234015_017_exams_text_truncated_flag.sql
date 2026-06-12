
ALTER TABLE exams ADD COLUMN IF NOT EXISTS text_truncated boolean NOT NULL DEFAULT false;
