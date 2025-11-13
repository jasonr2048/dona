import { decode } from "@services/parsing/shared/decoding";
import { maskName } from "@services/parsing/shared/names";

/**
 * Class that generates a map from contact names (e.g. Jane Doe) to pseudonyms (e.g. Contact4)
 */
export class ContactPseudonyms {
  private namesToPseudonyms: Record<string, string> = {};
  private pseudonymsToNames: Record<string, string> = {};
  private counter: number = 1;
  private readonly contactAlias: string;
  private readonly systemAlias?: string;

  constructor(contactAlias: string, systemAlias?: string) {
    this.contactAlias = contactAlias;
    this.systemAlias = systemAlias;
  }

  getPseudonym(name: string): string {
    const decodedName = decode(name);
    if (!this.namesToPseudonyms[decodedName]) {
      const pseudonym = this.systemAlias && name === this.systemAlias ? this.systemAlias! : `${this.contactAlias}${this.counter++}`;
      this.namesToPseudonyms[decodedName] = pseudonym;
      this.pseudonymsToNames[pseudonym] = decodedName;
    }
    return this.namesToPseudonyms[decodedName];
  }

  setPseudonym(name: string, pseudonym: string) {
    const decodedName = decode(name);
    this.namesToPseudonyms[decodedName] = pseudonym;
    this.pseudonymsToNames[pseudonym] = decodedName;
  }

  getPseudonymMap(): Record<string, string> {
    return this.namesToPseudonyms;
  }

  getOriginalNames(featuredPseudonyms: string[]): string[] {
    return featuredPseudonyms.map(pseudonym => this.pseudonymsToNames[pseudonym]).filter((name): name is string => name !== undefined);
  }
}

export class ChatPseudonyms {
  private chatPseudonymToParticipants: Map<string, string[]> = new Map();
  private counter: number = 1;
  private readonly donorAlias: string;
  private readonly chatAlias: string;
  private readonly dataSourceInitial: string;

  constructor(donorAlias: string, chatAlias: string, dataSourceValue: string) {
    this.donorAlias = donorAlias;
    this.chatAlias = chatAlias;
    this.dataSourceInitial = dataSourceValue.slice(0, 2).toWellFormed();
  }

  getPseudonym(participants: string[]): string {
    const decodedNames = participants.map(decode);
    const pseudonym = `${this.chatAlias} ${this.dataSourceInitial}${this.counter++}`;
    const maskedNames = decodedNames.map(maskName);
    this.chatPseudonymToParticipants.set(pseudonym, maskedNames);
    return pseudonym;
  }

  setDonorName(donorName: string): void {
    this.chatPseudonymToParticipants.set(this.donorAlias, [donorName]);
  }

  getPseudonymMap(): Map<string, string[]> {
    return this.chatPseudonymToParticipants;
  }
}
