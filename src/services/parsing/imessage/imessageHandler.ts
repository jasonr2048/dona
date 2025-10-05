import {Database, Statement} from 'sql.js';
import {AnonymizationResult, Conversation, DataSourceValue} from '@/models/processed';
import {ChatPseudonyms, ContactPseudonyms} from '@/services/parsing/shared/pseudonyms';
import {getAliasConfig} from '@services/parsing/shared/aliasConfig';
import {DonationErrors, DonationValidationError} from '@services/errors';

export default async function handleImessageDBFiles(files: File[], locateFile?: (file: string) => string): Promise<AnonymizationResult> {
    if (files.length !== 1) {
        throw DonationValidationError(DonationErrors.NotSingleDBFile);
    }

    const db = await createDatabase(files[0], locateFile);
    const messages: any[] = getMessages(db);
    const groupChats: Map<string, string> = getGroupChats(db);
    db.close();

    const aliasConfig = getAliasConfig();
    let donorName = '';
    const conversationsMap = new Map<string, Conversation>();
    const contactPseudonyms = new ContactPseudonyms(aliasConfig.contactAlias);
    const chatPseudonyms = new ChatPseudonyms(aliasConfig.donorAlias, aliasConfig.chatAlias, DataSourceValue.IMessage);
    const macEpochTime = new Date('2001-01-01T00:00:00Z').getTime();

    messages.forEach(message => {
        // Handle both second and nanosecond timestamps
        let timestamp: number;
        const dateValue = Number(message.date);

        // Check if timestamp is in nanoseconds (very large number > ~2030 in seconds)
        if (dateValue > 2000000000) { // Roughly year 2033 in seconds
            // Assume nanoseconds, convert to milliseconds
            timestamp = macEpochTime + Math.floor(dateValue / 1000000);
        } else {
            // Assume seconds
            timestamp = macEpochTime + (dateValue * 1000);
        }

        const sender: string = message.sender_id || 'Unknown';

        if (message.is_from_me && !donorName) {
            donorName = sender;
            chatPseudonyms.setDonorName(donorName);
            contactPseudonyms.setPseudonym(donorName, aliasConfig.donorAlias);
        }

        const conversationId = message.chat_id?.toString() || 'Unknown';
        const isGroupConversation = groupChats.has(conversationId);
        const isAudioMessage = message.is_audio_message;
        const pseudonym = contactPseudonyms.getPseudonym(sender);

        if (!conversationsMap.has(conversationId)) {
            conversationsMap.set(conversationId, {
                id: conversationId,
                isGroupConversation,
                dataSource: DataSourceValue.IMessage,
                messages: [],
                messagesAudio: [],
                participants: [],
                conversationPseudonym: ''
            });
        }

        const conversation = conversationsMap.get(conversationId);
        if (conversation) {
            if (!conversation.participants.includes(pseudonym)) {
                conversation.participants.push(pseudonym);
            }

            if (isAudioMessage) {
                conversation.messagesAudio.push({
                    lengthSeconds: 0,
                    timestamp,
                    sender: pseudonym
                });
            } else {
                // Improved word count calculation
                const wordCount = message.text ?
                    message.text.split(/\s+/).filter((word: string) => word.length > 0).length : 0;
                conversation.messages.push({
                    id: message.message_id?.toString(),
                    wordCount: wordCount,
                    timestamp,
                    sender: pseudonym
                });
            }
        }
    });

    conversationsMap.forEach(conversation => {
        const participants = contactPseudonyms.getOriginalNames(conversation.participants);
        const groupName = groupChats.get(conversation.id!);
        conversation.conversationPseudonym = chatPseudonyms.getPseudonym(
            groupName ? [groupName] : participants.filter(name => name !== donorName)
        );
    });

    return {
        anonymizedConversations: Array.from(conversationsMap.values()),
        participantNamesToPseudonyms: contactPseudonyms.getPseudonymMap(),
        chatMappingToShow: chatPseudonyms.getPseudonymMap()
    };
}

export async function createDatabase(file: File, locateFile?: (file: string) => string): Promise<Database> {
    const sqlPromise = import('sql.js/dist/sql-wasm.js');
    const SQL = await sqlPromise;
    const sqlWasm = await SQL.default({
        locateFile: locateFile || ((file: string) => `/sql-wasm/${file}`)
    });
    const fileBuffer = await file.arrayBuffer();
    return new sqlWasm.Database(new Uint8Array(fileBuffer));
}

export function getMessages(db: Database): any[] {
    const messages: any[] = [];
    const hasRoomName = db
        .exec("PRAGMA table_info(chat);")[0]
        .values.some(([_, name]: any[]) => name === "room_name");

    // Check for attributedBody column (modern databases)
    const hasAttributedBody = db
        .exec("PRAGMA table_info(message);")[0]
        .values.some(([_, name]: any[]) => name === "attributedBody");

    const groupColumn = hasRoomName
        ? "COALESCE(c.group_id, c.room_name, '') AS group_id"
        : "COALESCE(c.group_id, '') AS group_id";

    // Include attributedBody in query if it exists
    const attributedBodyColumn = hasAttributedBody ? 'm.attributedBody,' : '';

    const query = `
        SELECT
            m.ROWID AS message_id,
            COALESCE(m.text, '') AS text,
            ${attributedBodyColumn}
            m.date,
            CASE
                WHEN m.is_from_me = 1 THEN COALESCE(m.account, '')
                ELSE COALESCE(h.id, '')
                END AS sender_id,
            cmj.chat_id AS chat_id,
            ${groupColumn},
            COALESCE(m.is_from_me, 0) AS is_from_me,
            COALESCE(a.mime_type, '') AS mime_type
        FROM message m
                 LEFT JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
                 LEFT JOIN chat c ON cmj.chat_id = c.ROWID
                 LEFT JOIN message_attachment_join maj ON maj.message_id = m.ROWID
                 LEFT JOIN attachment a ON maj.attachment_id = a.ROWID
                 LEFT JOIN handle h ON m.handle_id = h.ROWID
        WHERE m.error = 0
          AND
            cmj.chat_id IS NOT NULL;
    `;

    const stmt = db.prepare(query);
    while (stmt.step()) {
        const row = stmt.getAsObject() as Record<string, any>;

        // Handle text extraction from attributedBody if text is empty
        if (hasAttributedBody && (!row.text || row.text === '') && row.attributedBody) {
            const extractedText = extractTextFromAttributedBody(row.attributedBody);
            if (extractedText) {
                row.text = extractedText;
            }
        }

        row["is_audio_message"] = typeof row.mime_type === "string" && row.mime_type.startsWith("audio/");
        messages.push(row);
    }
    stmt.free();
    return messages;
}

// Function to extract text from attributedBody blob
function extractTextFromAttributedBody(attributedBody: any): string | null {
    if (!attributedBody) return null;

    try {
        // Handle Buffer (Node.js)
        if (Buffer.isBuffer(attributedBody)) {
            return attributedBody.toString('utf8');
        }

        // Handle Uint8Array (SQLite.js)
        if (attributedBody instanceof Uint8Array) {
            return Buffer.from(attributedBody).toString('utf8');
        }

        // Handle raw array
        if (Array.isArray(attributedBody)) {
            return Buffer.from(attributedBody).toString('utf8');
        }

        return null;
    } catch (error) {
        return null;
    }
}

export function getGroupChats(db: Database): Map<string, string> {
    const groupChats = new Map<string, string>();

    const hasRoomName = db
        .exec("PRAGMA table_info(chat);")[0]
        .values.some(([_, name]: any[]) => name === "room_name");

    // Check if chat_handle_join table exists (enhanced/modern schemas)
    const hasChatHandleJoin = db
        .exec("SELECT name FROM sqlite_master WHERE type='table' AND name='chat_handle_join';")
        .length > 0;

    let stmt: Statement;

    // Enhanced/Modern approach: use chat_handle_join for participant counting
    if (hasChatHandleJoin) {

        const displayNameColumn = hasRoomName ?
            "COALESCE(c.display_name, c.room_name, '')" :
            "COALESCE(c.display_name, '')";

        stmt = db.prepare(`
            SELECT
                c.ROWID as chat_id,
                ${displayNameColumn} AS display_name,
                COUNT(DISTINCT chj.handle_id) AS participant_count
            FROM chat c
                     LEFT JOIN chat_handle_join chj ON c.ROWID = chj.chat_id
            GROUP BY c.ROWID
            HAVING participant_count > 2
        `);
    } else {

        // Legacy approach: use message-based participant counting
        const groupKey = hasRoomName
            ? "COALESCE(c.group_id, c.room_name) AS group_key"
            : "c.group_id AS group_key";

        const whereClause = hasRoomName
            ? "c.group_id IS NOT NULL OR c.room_name IS NOT NULL"
            : "c.group_id IS NOT NULL";

        stmt = db.prepare(`
            SELECT c.ROWID                      as chat_id,
                   ${groupKey},
                   COALESCE(c.display_name, '') AS display_name,
                   COUNT(DISTINCT h.ROWID)      AS participant_count
            FROM chat c
                     LEFT JOIN chat_message_join cmj ON c.ROWID = cmj.chat_id
                     LEFT JOIN message m ON cmj.message_id = m.ROWID
                     LEFT JOIN handle h ON m.handle_id = h.ROWID
            WHERE ${whereClause}
            GROUP BY c.ROWID
            HAVING participant_count > 2
        `);
    }

    while (stmt.step()) {
        const row = stmt.getAsObject() as Record<string, any>;
        groupChats.set(String(row.chat_id), String(row.display_name ?? ''));
    }
    stmt.free();
    return groupChats;
}
