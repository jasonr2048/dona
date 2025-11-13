export function createListOfConversations(
  conversationContacts: string[][],
  chat: string,
  chatInitial: string,
  chatWith: string,
  contactInitial: string,
  systemName: string
): string[] {
  const conversationsWithoutSystem = conversationContacts.map((conversation) =>
    conversation.filter((contact) => contact !== systemName)
  );

  return conversationsWithoutSystem.map((contacts, index) => {
    const shortenedContacts = contacts.map((contact) =>
      shortenContactPseudonym(contact, contactInitial, systemName)
    );

    let listItem = `${chatWith} <br> ${shortenedContacts[0]}`;
    for (let i = 1; i < shortenedContacts.length; i++) {
      if (shortenedContacts[i] !== "donor") {
        if (i > 6) {
          listItem += ", ...";
          break;
        }

        listItem += ", " + (i % 4 === 0 ? "<br>" : "") + shortenedContacts[i];
      }
    }

    return `${chat} ${chatInitial}${index + 1}`;
  });
}

const shortenContactPseudonym = (
  contact: string,
  contactInitial: string,
  systemName: string
): string => {
  if (contact === systemName) {
    return systemName;
  }

  const numberStart = contact.search(/\d+/); // Find where the number starts
  return numberStart !== -1 ? contactInitial + contact.substring(numberStart) : contact;
};

/**
 * Adjusts the range of a dataset by adding a percentage of the range as padding on both sides.
 * @param dates - Array of ISO 8601 date strings to compute the range from.
 * @param paddingRatio - The fraction of the range to add as padding (e.g., 0.05 for 5%).
 * @returns An object with xMin and xMax representing the adjusted range, or undefined if no dates are provided.
 */
export const adjustRange = (dates: string[], paddingRatio: number) => {
  if (!dates.length) return { xMin: undefined, xMax: undefined };

  const sortedDates = dates.sort();
  const xMin = new Date(`${sortedDates[0]}T00:00:00`).getTime();
  const xMax = new Date(`${sortedDates.at(-1)}T00:00:00`).getTime();
  const delta = xMax - xMin;

  return {
    xMin: xMin - paddingRatio * delta,
    xMax: xMax + paddingRatio * delta,
  };
};
