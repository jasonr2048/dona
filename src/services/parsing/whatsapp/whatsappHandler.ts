import {makeArrayOfMessages, parseMessages, ParsingResult} from '@services/parsing/whatsapp/whatsappParser';
import _ from "lodash";
import {AnonymizationResult} from "@models/processed";
import {DonationErrors, DonationValidationError} from "@services/errors";
import deIdentify from "@services/parsing/whatsapp/deIdentify";
import {validateMinChatsForDonation} from "@services/validation";

export default async function handleWhatsappTxtFiles(fileList: File[]): Promise<AnonymizationResult> {
    const files = Array.from(fileList);

    return new Promise((resolve, reject) => {

        if (!validateMinChatsForDonation(fileList)) {
            throw DonationValidationError(DonationErrors.TooFewChats);
        }

        const fileSize = files[0].size;
        const allSameSize = files.every(file => file.size === fileSize);
        if (allSameSize) {
            reject(DonationValidationError(DonationErrors.SameFiles));
            return;
        }

        const parsedFiles = files.map(file => readFile(file)
            .then(data => data.split('\n'))
            .then(makeArrayOfMessages)
            .then(parseMessages)
        );

        Promise.all(parsedFiles).then((parsed: ParsingResult[]) => {

            console.log("Parsed files:", parsed);
            const parsedConversations = parsed.map((obj) => obj.texts);
            const contacts = parsed.map((obj) => obj.contacts);

            // Determine donor name
            const guessedDonorName = determineDonorName(contacts);
            if (!guessedDonorName) {
                reject(DonationValidationError(DonationErrors.NoDonorNameFound));
                return;
            }

            resolve(deIdentify(parsedConversations, guessedDonorName));

        }).catch((error) => reject(error));
    });
}

async function readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => resolve(event.target?.result as string);
        reader.onerror = error => reject(error);
        reader.readAsText(file);
    });
}

function determineDonorName(contacts: string[][]): string | undefined {
    // Find intersection of all contacts arrays
    const intersection = _.intersection(...contacts);
    if (intersection.length === 1) {
        return intersection[0];
    }
    // If no single person is in all chats, pick the one in the most chats
    const allNames = _.flatten(contacts);
    const nameCounts = _.countBy(allNames);
    const sortedNames = Object.entries(nameCounts).sort((a, b) => b[1] - a[1]);
    if (sortedNames.length > 0) {
        return sortedNames[0][0];
    }
    return undefined;
}