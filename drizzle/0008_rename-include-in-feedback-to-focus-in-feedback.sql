-- Custom SQL migration file: rename include_in_feedback to focus_in_feedback --
ALTER TABLE conversations
    RENAME COLUMN "include_in_feedback" TO "focus_in_feedback";
