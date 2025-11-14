-- Custom SQL migration file: add emoji counts to message details in data analysis --
ALTER TABLE "conversations"
    ADD COLUMN "conversation_hash" text;
--> statement-breakpoint
CREATE INDEX "conversation_hash_idx" ON "conversations" USING btree ("conversation_hash");
