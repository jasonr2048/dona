-- Custom SQL migration file: add created_at column to donations table --
ALTER TABLE donations
    ADD COLUMN created_at TIMESTAMP DEFAULT NOW() NOT NULL;
