import {describe, expect, it} from '@jest/globals';
import {Conversation} from "@models/processed";

import handleWhatsappTxtFiles from '@services/parsing/whatsapp/whatsappHandler';
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

async function createMockFile(content: string, fileName: string = 'chat.txt'): Promise<File> {
    return new File([content], fileName, { type: 'text/plain' });
}

function createMockWhatsAppChat(donorName: string, contactName: string, isGroup: boolean = false): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const formatDate = (date: Date) => {
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;
    };
    
    const todayStr = formatDate(today);
    const yesterdayStr = formatDate(yesterday);
    
    let chat = '';
    
    // Add group creation message if it's a group chat
    if (isGroup) {
        chat += `${yesterdayStr}, 10:00 - ${donorName} created group "Test Group"\n`;
        chat += `${yesterdayStr}, 10:01 - ${donorName} added ${contactName}\n`;
    }
    
    // Add regular messages
    chat += `${yesterdayStr}, 12:00 - ${contactName}: Hello there!\n`;
    chat += `${yesterdayStr}, 12:05 - ${donorName}: Hi, how are you?\n`;
    chat += `${yesterdayStr}, 12:10 - ${contactName}: I'm good, thanks for asking.\n`;
    chat += `${yesterdayStr}, 12:15 - ${donorName}: Great to hear that.\n`;
    
    // Add a multi-line message
    chat += `${todayStr}, 09:00 - ${contactName}: This is a multi-line message.\nIt spans multiple lines.\nJust to test the parser.\n`;
    
    // Add more messages
    chat += `${todayStr}, 09:15 - ${donorName}: I see, that's interesting.\n`;
    chat += `${todayStr}, 09:20 - ${contactName}: Yes, indeed!\n`;
    
    return chat;
}

describe('handleWhatsappTxtFiles', () => {

    it('should process a mock WhatsApp chat file correctly', async () => {
        const donorName = 'John Doe';
        const contactName = 'Jane Smith';
        
        // Create 5 different chat files to meet the minimum requirement
        const mockFiles = [];
        for (let i = 0; i < 5; i++) {
            const contactNameWithIndex = `${contactName} ${i+1}`;
            const mockContent = createMockWhatsAppChat(donorName, contactNameWithIndex);
            mockFiles.push(await createMockFile(mockContent, `chat${i+1}.txt`));
        }
        
        const result = await handleWhatsappTxtFiles(mockFiles);
        
        // Verify the result is defined
        expect(result).toBeDefined();
        
        // Verify we have the expected number of conversations
        expect(result.anonymizedConversations.length).toBe(5);
        
        // Verify each conversation has the expected properties
        result.anonymizedConversations.forEach(conversation => {
            expect(conversation.isGroupConversation).toBe(false);
            expect(conversation.dataSource).toBe('whatsapp');
            
            // Verify the conversation has the correct number of messages
            expect(conversation.messages.length).toBe(7); // 7 regular messages
            
            // Verify the conversation has the correct number of participants
            expect(conversation.participants.length).toBe(2);
            
            // Verify the conversation pseudonym is generated
            expect(conversation.conversationPseudonym).toBeTruthy();
        });
        
        // Verify the participant pseudonyms are generated (donor + 5 contacts)
        expect(Object.keys(result.participantNamesToPseudonyms).length).toBe(6);
        
        // Verify the chat mapping is generated (5 conversations)
        expect(result.chatMappingToShow.size).toBe(5);
    });
    
    it('should process a mock WhatsApp group chat file correctly', async () => {
        const donorName = 'John Doe';
        const contactName = 'Jane Smith';
        
        // Create 5 different chat files to meet the minimum requirement
        const mockFiles = [];
        // One group chat
        mockFiles.push(await createMockFile(createMockWhatsAppChat(donorName, contactName, true), 'group_chat.txt'));
        
        // Four regular chats
        for (let i = 0; i < 4; i++) {
            const contactNameWithIndex = `${contactName} ${i+1}`;
            const mockContent = createMockWhatsAppChat(donorName, contactNameWithIndex);
            mockFiles.push(await createMockFile(mockContent, `chat${i+1}.txt`));
        }
        
        const result = await handleWhatsappTxtFiles(mockFiles);
        
        // Verify the result is defined
        expect(result).toBeDefined();
        
        // Verify we have the expected number of conversations
        expect(result.anonymizedConversations.length).toBe(5);
        
        // Find the group conversation
        const groupConversation = result.anonymizedConversations.find(conv => conv.isGroupConversation);
        expect(groupConversation).toBeDefined();
        
        // Verify the group conversation has the expected properties
        expect(groupConversation!.dataSource).toBe('whatsapp');
        
        // Verify the group conversation has the correct number of messages
        // 7 regular messages + 2 system messages = 9
        expect(groupConversation!.messages.length).toBe(9);
        
        // Verify the group conversation has the correct number of participants
        // 2 participants + System = 3
        expect(groupConversation!.participants.length).toBe(3);
        
        // Verify the conversation pseudonym is generated
        expect(groupConversation!.conversationPseudonym).toBeTruthy();
        
        // Verify the participant pseudonyms are generated (donor, contacts, system)
        // Donor + 5 contacts (1 in group, 4 in regular chats) + System = 7
        expect(Object.keys(result.participantNamesToPseudonyms).length).toBe(7);
        
        // Verify the chat mapping is generated (5 conversations)
        expect(result.chatMappingToShow.size).toBe(5);
    });
    
    it('should process multiple WhatsApp chat files correctly', async () => {
        const donorName = 'John Doe';
        const contact1 = 'Jane Smith';
        const contact2 = 'Bob Johnson';
        
        // Create 5 different chat files to meet the minimum requirement
        const mockFiles = [];
        
        // Two regular chats with different contacts
        mockFiles.push(await createMockFile(createMockWhatsAppChat(donorName, contact1), 'chat1.txt'));
        mockFiles.push(await createMockFile(createMockWhatsAppChat(donorName, contact2), 'chat2.txt'));
        
        // One group chat
        mockFiles.push(await createMockFile(createMockWhatsAppChat(donorName, contact1, true), 'group1.txt'));
        
        // Two more regular chats
        mockFiles.push(await createMockFile(createMockWhatsAppChat(donorName, 'Alice Brown'), 'chat3.txt'));
        mockFiles.push(await createMockFile(createMockWhatsAppChat(donorName, 'Charlie Davis'), 'chat4.txt'));
        
        const result = await handleWhatsappTxtFiles(mockFiles);
        
        // Verify the result is defined
        expect(result).toBeDefined();
        
        // Verify we have the expected number of conversations
        expect(result.anonymizedConversations.length).toBe(5);
        
        // Verify the conversations have the expected properties
        const conversationStats = computeConversationStats(result.anonymizedConversations);
        expect(conversationStats.size).toBe(5);
        
        // Verify there's one group conversation
        const groupConversations = result.anonymizedConversations.filter(conv => conv.isGroupConversation);
        expect(groupConversations.length).toBe(1);
        
        // Verify there are four regular conversations
        const regularConversations = result.anonymizedConversations.filter(conv => !conv.isGroupConversation);
        expect(regularConversations.length).toBe(4);
        
        // Verify the participant pseudonyms are generated
        // Donor + 4 contacts + System = 6
        expect(Object.keys(result.participantNamesToPseudonyms).length).toBe(6);
        
        // Verify the chat mapping is generated (5 conversations)
        expect(result.chatMappingToShow.size).toBe(5);
        
        // Verify donor is correctly identified
        const donorPseudonym = result.participantNamesToPseudonyms[donorName];
        expect(donorPseudonym).toBe('Donor');
    });
    
    it('should handle errors when processing invalid files', async () => {
        // Create 5 files to meet the minimum requirement, but make one invalid
        const mockFiles = [];
        const donorName = 'John Doe';
        
        // Add 4 valid files
        for (let i = 0; i < 4; i++) {
            const contactName = `Contact ${i+1}`;
            const mockContent = createMockWhatsAppChat(donorName, contactName);
            mockFiles.push(await createMockFile(mockContent, `chat${i+1}.txt`));
        }
        
        // Add 1 invalid file
        const invalidContent = 'This is not a valid WhatsApp chat format';
        mockFiles.push(await createMockFile(invalidContent, 'invalid.txt'));
        
        // The handler should throw an error when processing invalid content
        await expect(handleWhatsappTxtFiles(mockFiles)).rejects.toThrow();
    });
});