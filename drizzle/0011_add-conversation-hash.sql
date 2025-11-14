ALTER TABLE "conversations" ADD COLUMN "conversation_hash" text;--> statement-breakpoint
CREATE INDEX "conversation_hash_idx" ON "conversations" USING btree ("conversation_hash");