# WhatsApp Artificial Export Prompt

Generate a **realistic fake WhatsApp `.txt` export** representing the chat history of a single user (e.g., "John Doe"). 
The export must match the format and structure of recent Android/iOS WhatsApp `.txt` exports.

## Content Requirements

- Generate multiple separate `.txt` chat exports, to be saved in a `.zip` file and provided as a single download.
- You must respect the number of chats and messages per chat as specified in the options block below.
  - At least 5 chats must contain at least 100 messages
  - Each chat must include 5–10 system messages
  - The rest are normal user messages with realistic names and text

## Single-User Consistency

- The export must represent a single user's data (e.g., "John Doe")
- That user must:
  - Be a participant in all chats
  - Appear as a sender in most chats (can be quiet in some)
  - Be referenced in system messages when not sending messages (e.g., "John Doe left")

## 💬 Chat Content

- Mix of 1:1 and group chats
- Group chats should contain up to 5 realistic participants
- The language of system messages should be consistent per chat:
  - English, German, or Armenian
- Use actual system message strings found in recent real WhatsApp exports
  - Do not use translated or deprecated versions

## 🕣 Timestamp Requirements

- Message timestamps must span over **6 full calendar months**
  - Valid: Jan 1 – July 2, 2023
  - Invalid: Jan 1 – June 30, 2023

## Message Format

Each message must match the WhatsApp export format exactly:

### User Message
```DD/MM/YY, HH:MM - Sender: Message```

### System Message
```DD/MM/YY, HH:MM - System message```


## 🧪 Optional: Include Export Summary

Optionally provide a **summary of the generated file**, including:

- List of chats:
  - `chat_id`, `display_name`, `num_participants`, `num_messages`, `num_audio_messages`

This helps validate downstream parsing.

## Output

- A `.zip` file containing the `.txt` chat exports
- A separate `.txt` file listing all system messages used, grouped by language
- An optional summary file with the export overview


## 🧾 Options Block (CUSTOMIZE HERE)

```json
{
  "numChats": 6,
  "minMessagesPerChat": 100,
  "maxMessagesPerChat": 150,
  "includeSummary": true
}
```