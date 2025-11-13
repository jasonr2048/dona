export enum RangeErrors {
  NonsenseRange = "NonsenseRange",
  NotEnoughMonthsInRange = "NotEnoughMonthsInRange",
  NoMessagesInRange = "NoMessagesInRange"
}

export enum DonationErrors {
  SameFiles = "SameFiles",
  NotSingleDBFile = "NotSingleDBFile",
  TooFewChats = "TooFewChats",
  TooFewContactsOrMessages = "TooFewContactsOrMessages",
  TooShortTimePeriod = "TooShortTimePeriod",
  NoProfile = "NoProfile",
  NoMessageEntries = "NoMessageEntries",
  NoDonorNameFound = "NoDonorNameFound",
  DuplicateDonorId = "DuplicateDonorId",
  TransactionFailed = "TransactionFailed",
  UnknownError = "UnknownError"
}

export interface DonationError {
  message: string;
  reason: DonationErrors;
  context?: Record<string, any>;
}

export interface DonationValidationError extends DonationError {}
export interface DonationProcessingError extends DonationError {}

export interface SerializedDonationError {
  message: string;
  reason: DonationErrors;
  context?: Record<string, any>;
}

export const DonationValidationError = (reason: DonationErrors, context?: Record<string, any>): DonationValidationError => ({
  message: reason,
  reason,
  context
});

export const DonationProcessingError = (reason: DonationErrors, context?: Record<string, any>): DonationProcessingError => ({
  message: reason,
  reason,
  context
});

/**
 * Converts an error to a formatted error message using next-intl translations.
 *
 * @param t - The translation function from `useTranslations`.
 * @param error - The error object to interpret.
 * @param formatOptions - Optional dictionary for formatting variables.
 * @returns The formatted error message or a fallback.
 */
export function getErrorMessage(t: { (key: string, options?: Record<string, any>): string; has: (key: string) => boolean }, error: unknown, formatOptions?: Record<string, any>): string {
  if (error && typeof error === "object" && "reason" in error) {
    const reasonKey = `errors.${(error as DonationError).reason}`;
    const formattedKey = `${reasonKey}_format`;

    if (t.has(formattedKey)) return t(formattedKey, formatOptions);
    if (t.has(reasonKey)) return t(reasonKey);
  } else if (error && typeof error === "string") {
    const formattedKey = `errors.${error}_format`;
    if (t.has(formattedKey)) return t(formattedKey, formatOptions);
    if (t.has(`errors.${error}`)) return t(`errors.${error}`);
  }

  return t("errors.UnknownError");
}
