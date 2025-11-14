-- Custom SQL migration file: increase conversation pseudonym max length --
ALTER TABLE conversations
    ALTER COLUMN conversation_pseudonym TYPE varchar(20);
