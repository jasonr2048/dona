-- Custom SQL migration file: add include_in_feedback to conversations --
ALTER TABLE conversations
    ADD COLUMN "include_in_feedback" boolean DEFAULT true;
