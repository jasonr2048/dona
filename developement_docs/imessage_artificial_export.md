# 📦 iMessage Fake Export Prompt (chat.db Format)

Generate a **realistic fake iMessage `chat.db` export** representing the chat history of a single user (e.g., "John Doe").
The export much be compatible with iOS/macOS extraction and contain data in the `SQLite` schema used by Apple.


## ✅ Structure

- **Format**: a `chat.db` SQLite file (`application/x-sqlite3`)
- **Schema**: Use either the **legacy** (pre-iOS 16) or **modern** (iOS 16+) format
    - Specify using: `format: "legacy"` or `format: "modern"` (optional; defaults to `legacy`)
- Must include:
    - `message`, `handle`, `chat`, `chat_message_join`, `message_attachment_join`, and `attachment` tables
    - For modern: also include `sync_deleted_message`, `chat_handle_join`, etc., as used in current exports


## 💬 Chat Content

- Number of chats: between `6–12`
- At least `5` chats with `100+ messages` and `2+ participants`
- Each chat must span **≥6 full calendar months**  
  _E.g. from Jan 1 → July 1 counts, but Jan 1 → June 30 does not_
- Mix of:
    - **Group** and **1-on-1** conversations
    - **Text messages** and **audio messages**
- Each message must include:
    - `text`, `handle_id`, `date`, `is_from_me`, and optionally audio/attachment info
- Include:
    - Special characters and emojis
    - Varied participant names
- The donor (user whose export this is) must be a participant in **all** chats  
  _(sometimes actively, sometimes silent or having left)_


## 📁 Attachments

- Include some **audio attachments**:
    - Format examples: `audio/aac`, `audio/mpeg`
- Link attachments properly to messages using:
    - `message_attachment_join`, `attachment.mime_type`, and `ROWID`
- Ensure timestamps are plausible (`creation_timestamp`)


## 🌍 Locales

- Use names and messages from different languages:
    - English, German, Armenian
- Include emojis and non-ASCII characters to simulate realistic chats


## 🧪 Optional: Include Export Summary

Optionally provide a **summary of the generated file**, including:

- List of chats:
    - `chat_id`, `display_name`, `num_participants`, `num_messages`, `num_audio_messages`

This helps validate downstream parsing.


## 🧾 Options Block (CUSTOMIZE HERE)

```json
{
  "format": "modern",
  "numChats": 8,
  "minMessagesPerChat": 80,
  "maxMessagesPerChat": 150,
  "includeAudio": true,
  "includeSummary": true
}
```