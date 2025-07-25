import {daysBeforeMonths, normalizeDate, NumericDate} from './utils/date';
import {convertTime12to24, normalizeAMPM, normalizeTime} from './utils/time';
import {getAliasConfig} from "@services/parsing/shared/aliasConfig";


const regexStartsWithDateTime = /\[?(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}),? (\d{1,2}[.:]\d{1,2}(?:[.:]\d{1,2})?)(?: ([ap]\.?m\.?))?]?/i;
const regexMessageEntryParser = /\[?(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}),? (\d{1,2}[.:]\d{1,2}(?:[.:]\d{1,2})?)(?: ([ap]\.?m\.?))?]?(?: -|:)? (?:(.+?): )?((?:.|\s)*)/i;

type Options = {
    daysFirst?: boolean;
};

export type ParsedLine = {
    date: string;
    time: string;
    ampm: string | null;
    author: string;
    message: string;
};

export type ParsedMessage = {
    date: number;
    author: string;
    message: string;
};

export type ParsingResult = {
    texts: ParsedMessage[];
    contacts: string[];
};


function inferDateFormat(datedItems: { date: string }[]): boolean | null {
    const numericDates: NumericDate[] = Array.from(
        new Set(datedItems.map(({date}) => date)),
        (date) => {
            const dateParts = date.split(/[-/.]/).map(Number);

            // Ensure there are exactly three parts (day, month, year)
            if (dateParts.length === 3) {
                return dateParts as NumericDate;
            }

            throw new Error(`Invalid date format: ${date}`);
        }
    );
    return daysBeforeMonths(numericDates);
}

function computeDateTime(date: string, time: string, ampm: string | null, daysFirst: boolean | null): number {
    let day, month, year;

    if (daysFirst === false) {
        [month, day, year] = date.split(/[-/.]/);
    } else {
        [day, month, year] = date.split(/[-/.]/);
    }
    [year, month, day] = normalizeDate(year, month, day);

    const [hours, minutes, seconds] = normalizeTime(
        ampm ? convertTime12to24(time, normalizeAMPM(ampm)) : time
    ).split(/[:.]/);

    // Convert month and year to numbers before using them in Date constructor
    return new Date(
        Number(year), Number(month) - 1, Number(day),
        Number(hours), Number(minutes), Number(seconds)
    ).getTime()
}

/**
 * Given an array of lines, detects the lines that are part of a previous
 * message (multiline messages) and merges them.
 */
export function makeArrayOfMessages(lines: string[]): string[] {
    return lines.reduce((acc: string[], line: string) => {
        /**
         * If the line doesn't conform to the regex, it's probably part of the
         * previous message or a "WhatsApp event."
         */
        if (!regexStartsWithDateTime.test(line)) {

            // If last element isn't set, just skip this (likely empty file)
            if (typeof acc.slice(-1)[0] === 'undefined') return acc;

            // Else it's part of the previous message and should be concatenated.
            return acc.slice(0, -1).concat(`${acc.slice(-1)[0]}\n${line}`);
        }

        return acc.concat(line);
    }, []);
}

/**
 * Given an array of messages, parses them and returns an object with the field's
 * date, author, and message.
 */
export function parseMessages(messages: string[], options: Options = {}): ParsingResult {
    const aliasConfig = getAliasConfig();
    let allContactNames: string[] = [];

    const parsed = messages.map(msg => {

        // Extract date, time, ampm, and the rest of the message
        const match = regexMessageEntryParser.exec(msg);
        if (!match) return null;

        const [, date, time, ampm, author, messageText] = match;

        // System messages
        if (!author) {
            return { date, time, ampm: ampm || null, author: aliasConfig.systemAlias, message: messageText };
        }

        allContactNames.push(author);
        return { date, time, ampm: ampm || null, author, message: messageText };
    })
    .filter(Boolean) as ParsedLine[];

    // Remove duplicate contact names.
    allContactNames = [...new Set(allContactNames)];

    // Try to understand date format if not supplied (days before month or opposite)
    let daysFirst: boolean | null = options.daysFirst ?? inferDateFormat(parsed);

    // Convert date/time into a date object, then return the final object.
    const parsedMessages: ParsedMessage[] = parsed.map(({date, time, ampm, author, message}) => {
        return {
            date: computeDateTime(date, time, ampm, daysFirst),
            author,
            message,
        };
    });

    return {
        texts: parsedMessages,
        contacts: allContactNames,
    };
}