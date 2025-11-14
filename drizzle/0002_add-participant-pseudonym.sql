-- Custom SQL migration file: add participant pseudonym to conversation participants --
ALTER TABLE "conversation_participants"
    ADD COLUMN "participant_pseudonym" text;
