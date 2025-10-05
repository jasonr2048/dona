import fs from 'fs';
import path from 'path';
import initSqlJs from 'sql.js';
import handleImessageDBFiles from '@services/parsing/imessage/imessageHandler';
import {describe, expect, it} from '@jest/globals';
import {computeConversationStats} from "@services/__tests__/testHelpers";

jest.mock('@services/parsing/shared/aliasConfig', () => {
    const actual = jest.requireActual('@services/parsing/shared/aliasConfig');
    return {
        ...actual,
        getAliasConfig: jest.fn(() => new actual.AliasConfig(
            'System',
            'Contact',
            'Donor',
            'Chat'
        )),
    };
});

async function createMockFile(): Promise<File> {
    const SQL = await initSqlJs();
    const db = new SQL.Database();

    // Tables
    db.run(`
        CREATE TABLE handle (rowid INTEGER PRIMARY KEY, id TEXT);
        CREATE TABLE message (
             rowid INTEGER PRIMARY KEY,
             text TEXT,
             date INTEGER,
             handle_id INTEGER,
             is_from_me INTEGER
        );
        CREATE TABLE chat (
              rowid INTEGER PRIMARY KEY,
              chat_identifier TEXT,
              group_id TEXT,
              room_name TEXT,
              display_name TEXT
        );
        CREATE TABLE chat_message_join (chat_id INTEGER, message_id INTEGER);
        CREATE TABLE attachment (rowid INTEGER PRIMARY KEY, mime_type TEXT);
        CREATE TABLE message_attachment_join (message_id INTEGER, attachment_id INTEGER);
    `);

    // Handles (contacts)
    db.run(`
        INSERT INTO handle (rowid, id) VALUES (1, '+1234567890');  -- Contact A
        INSERT INTO handle (rowid, id) VALUES (2, '+9876543210');  -- Donor
        INSERT INTO handle (rowid, id) VALUES (3, '+1922333444');  -- Contact B
    `);

    // 1-on-1 chat (no group_id)
    db.run(`
        INSERT INTO chat (rowid, chat_identifier, group_id, room_name, display_name)
        VALUES (1, '+1234567890', NULL, NULL, '');
        INSERT INTO message (rowid, text, date, handle_id, is_from_me)
        VALUES (1, 'Hey there!', 1620000000000000, 1, 0),           -- Contact A
               (2, 'Hi!',       1620000100000000, 2, 1);           -- Donor
        INSERT INTO chat_message_join (chat_id, message_id)
        VALUES (1, 1), (1, 2);
    `);

    // Group chat (3 people)
    db.run(`
        INSERT INTO chat (rowid, chat_identifier, group_id, room_name, display_name)
        VALUES (2, 'groupchat@apple.com', 'group_abc', 'Test Room', 'Study Buddies');
        INSERT INTO message (rowid, text, date, handle_id, is_from_me)
        VALUES (3, 'Yo team!', 1620000200000000, 1, 0),
               (4, 'Ready for the exam?', 1620000300000000, 2, 1),
               (5, '', 1620000400000000, 3, 0); -- Audio message from Contact B
        INSERT INTO chat_message_join (chat_id, message_id) 
        VALUES (2, 3), (2, 4), (2, 5);
        INSERT INTO attachment (rowid, mime_type) 
        VALUES (1, 'audio/aac');
        INSERT INTO message_attachment_join (message_id, attachment_id) 
        VALUES (5, 1);
    `);

    const buffer = db.export();
    db.close();
    return new File([buffer], 'mock_imessage.sqlite', { type: 'application/x-sqlite3' });
}


const testCases = [
    {
        label: 'Generated mock iMessage data',
        fileName: 'mock_imessage.sqlite',
        dynamic: true,
        expected: {
            numConversations: 2,
            conversations: {
                '1': { participants: 2, messages: 2, audioMessages: 0 },  // 1-on-1 chat
                '2': { participants: 3, messages: 2, audioMessages: 1 }  // group chat
            },
            participantCount: 3,  // all real contacts used
            chatMappingToShow: new Map([  // 2 conv + donor
                ['Donor', ['+9876543210']],
                ['Chat IM1', ['+1*********']],  // From +1234567890
                ['Chat IM2', ['St*** Bu*****']]  // From 'Study Buddies' group
            ])
        }
    },
    {
        label: 'Legacy iMessage export (iOS 10 era)',
        fileName: 'chat_legacy.db',
        dynamic: false,
        expected: {
            numConversations: 7,
            conversations: {
                '1': { participants: 4, messages: 111, audioMessages: 1 },     // Family Group
                '2': { participants: 2, messages: 103, audioMessages: 0 },     // 1-on-1 chat
                '3': { participants: 4, messages: 121, audioMessages: 0 },     // Work Team
                '4': { participants: 2, messages: 105, audioMessages: 0 },     // 1-on-1 chat
                '5': { participants: 4, messages: 143, audioMessages: 0 },     // Berlin Friends
                '6': { participants: 2, messages: 107, audioMessages: 0 },     // 1-on-1 chat
                '7': { participants: 4, messages: 122, audioMessages: 0 }      // Study Group
            },
            participantCount: 16,  // Donor + 15 generated contacts
            chatMappingToShow: new Map([
                ['Donor', ['+1234567890']],                    // Unmasked donor phone
                ['Chat IM1', ['Fa**** Gr***']],               // "Family Group" → maskName output
                ['Chat IM2', ['+3************']],                // Phone like "+1234567890" → "+1*********"
                ['Chat IM3', ['Wo** Te**']],                  // "Work Team" → maskName output
                ['Chat IM4', ['+4***********']],           // Email like "anna@example.com" → maskName output
                ['Chat IM5', ['Be**** Fr*****']],             // "Berlin Friends" → maskName output
                ['Chat IM6', ['an*************']],                // Phone like "+49xxxxxxxxx" → "+4*********"
                ['Chat IM7', ['St*** Gr***']]                 // "Study Group" → maskName output
            ])
        }
    },
    {
        label: 'Enhanced iMessage export (iOS 14 era)',
        fileName: 'chat_enhanced.db',
        dynamic: false,
        expected: {
            numConversations: 7,
            conversations: {
                '1': { participants: 3, messages: 166, audioMessages: 7 },     // Family Chat
                '2': { participants: 2, messages: 133, audioMessages: 0 },     // 1-on-1 chat
                '3': { participants: 4, messages: 156, audioMessages: 0 },     // Weekend Plans
                '4': { participants: 2, messages: 165, audioMessages: 0 },    // 1-on-1 chat
                '5': { participants: 3, messages: 116, audioMessages: 0 },     // Project Team
                '6': { participants: 2, messages: 169, audioMessages: 0 },    // 1-on-1 chat
                '7': { participants: 3, messages: 174, audioMessages: 0 }      // Language Exchange
            },
            participantCount: 13,  // Donor + 12 generated contacts
            chatMappingToShow: new Map([
                ['Donor', ['+1234567890']],
                ['Chat IM1', ['Fa**** Ch**']],         // Family Chat
                ['Chat IM2', ['+1**********']],       // Contact handle
                ['Chat IM3', ['We***** Pl***']],       // Weekend Plans
                ['Chat IM4', ['+1**********']],      // Email contact
                ['Chat IM5', ['Pr***** Te**']],        // Project Team
                ['Chat IM6', ['+1**********']],       // Contact handle
                ['Chat IM7', ['La****** Ex******']]      // Language Exchange
            ])
        }
    },
    {
        label: 'Modern iMessage export (iOS 16+ era)',
        fileName: 'chat_modern.db',
        dynamic: false,
        expected: {
            numConversations: 7,
            conversations: {
                '1': { participants: 3, messages: 109, audioMessages: 10 },    // Travel Plans ✈️
                '2': { participants: 2, messages: 143, audioMessages: 14 },    // 1-on-1 chat
                '3': { participants: 5, messages: 103, audioMessages: 10 },    // Berlin Crew
                '4': { participants: 2, messages: 117, audioMessages: 11 },    // 1-on-1 chat
                '5': { participants: 3, messages: 149, audioMessages: 14 },    // Work Standup
                '6': { participants: 2, messages: 145, audioMessages: 14 },    // 1-on-1 chat
                '7': { participants: 4, messages: 117, audioMessages: 11 }     // Music Night 🎶
            },
            participantCount: 15,  // Donor + 14 generated contacts
            chatMappingToShow: new Map([
                ['Donor', ['+1234567890']],
                ['Chat IM1', ['Tr**** Pl*** ✈️']],     // Travel Plans ✈️
                ['Chat IM2', ['+3************']],       // Contact handle
                ['Chat IM3', ['Be**** Cr**']],         // Berlin Crew
                ['Chat IM4', ['+4************']],       // Contact handle
                ['Chat IM5', ['Wo** St*****']],        // Work Standup
                ['Chat IM6', ['an**@******.***']],       // Contact handle
                ['Chat IM7', ['Mu*** Ni*** 🎶']]       // Music Night 🎶
            ])
        }
    }
];

describe('handleImessageDBFiles', () => {
    for (const testCase of testCases) {
        it(`correctly parses ${testCase.label}`, async () => {
            let testFile: File;
            if (testCase.dynamic) {
                testFile = await createMockFile();
            } else {
                const filePath = path.resolve(__dirname, `../../../test_data/imessage/${testCase.fileName}`);
                const fileBuffer = fs.readFileSync(filePath);
                testFile = new File([fileBuffer], testCase.fileName, {type: 'application/x-sqlite3'});
            }

            const locateFile = (f: string) => path.resolve(process.cwd(), 'node_modules/sql.js/dist', f);
            const result = await handleImessageDBFiles([testFile], locateFile);

            expect(result).toBeDefined();

            const stats = computeConversationStats(result.anonymizedConversations);
            expect(stats.size).toBe(testCase.expected.numConversations);

            for (const [id, expectedStat] of Object.entries(testCase.expected.conversations)) {
                expect(stats.has(id)).toBe(true);
                const actual = stats.get(id)!;
                expect(actual.messages).toBe(expectedStat.messages);
                expect(actual.audioMessages).toBe(expectedStat.audioMessages);
                expect(actual.participants).toBe(expectedStat.participants);
            }

            expect(Object.keys(result.participantNamesToPseudonyms).length).toBe(testCase.expected.participantCount);
            expect(result.chatMappingToShow.size).toBe(testCase.expected.chatMappingToShow.size);
            expect(result.chatMappingToShow).toEqual(testCase.expected.chatMappingToShow);
        });
    }
});

