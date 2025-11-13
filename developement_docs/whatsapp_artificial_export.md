# WhatsApp Artificial Export Prompt

Generate a realistic fake WhatsApp `.txt` export representing the chat history of a single user (e.g., "John Doe"). The export must match the format and structure of recent Android/iOS WhatsApp `.txt` exports.

## Content Requirements

- Generate 6 separate `.txt` chat exports (to be saved in a `.zip` file)
- Each chat must contain 50–150 messages
  - At least 5 chats must contain at least 100 messages
  - Each chat must include 5–10 system messages
  - The rest are normal user messages with realistic names and text

## Single-User Consistency

- The export must represent a single user's data (e.g., "John Doe")
- That user must:
  - Be a participant in all chats
  - Appear as a sender in most chats (can be quiet in some)
  - Be referenced in system messages when not sending messages (e.g., "John Doe left")

## Chat Structure

- Mix of 1:1 and group chats
- Group chats should contain up to 5 realistic participants
- The language of system messages should be consistent per chat:
  - English, German, or Armenian
- Use actual system message strings found in recent real WhatsApp exports
  - Do not use translated or deprecated versions

## Timestamp Requirements

- Message timestamps must span over **6 full calendar months**
  - Valid: Jan 1 – July 2, 2023
  - Invalid: Jan 1 – June 30, 2023

## Message Format

Each message must match the WhatsApp export format exactly:

### User Message

`DD/MM/YY, HH:MM - Sender: Message`

### System Message

`DD/MM/YY, HH:MM - System message`

## Output

- A `.zip` file containing the 6 `.txt` chat exports
- A separate `.txt` file listing all system messages used, grouped by language
