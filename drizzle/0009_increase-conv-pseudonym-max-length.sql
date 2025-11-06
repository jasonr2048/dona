-- Custom SQL migration file, put your code below! --
ALTER TABLE conversations ALTER COLUMN conversation_pseudonym TYPE varchar(20);
