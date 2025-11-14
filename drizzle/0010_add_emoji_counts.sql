-- Custom SQL migration file: add emoji counts to message details in data analysis --
ALTER TABLE "messages"
    ADD COLUMN "emoji_counts" jsonb;
