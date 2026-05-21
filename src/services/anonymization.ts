import { AnonymizationResult, DataSourceValue } from "@models/processed";
import { DonationErrors, DonationValidationError } from "@services/errors";
import handleImessageDBFiles from "@services/parsing/imessage/imessageHandler";
import { handleFacebookZipFiles, handleInstagramZipFiles } from "@services/parsing/meta/metaHandlers";
import { extractTxtFilesFromZip } from "@services/parsing/shared/zipExtraction";
import handleWhatsappTxtFiles from "@services/parsing/whatsapp/whatsappHandler";
import { getDonationRequirementChecks, getFailedDonationRequirementErrors } from "@services/validation";
import {
  validateMinChatsForDonation,
  validateMinImportantChatsForDonation,
  validateMinTimePeriodForDonation
} from "@services/validation";

interface AnonymizeDataOptions {
  skipValidation?: boolean;
}

export async function anonymizeData(
  dataSourceValue: DataSourceValue,
  files: File[],
  options: AnonymizeDataOptions = {}
): Promise<AnonymizationResult> {
  let resultPromise;
  switch (dataSourceValue) {
    case DataSourceValue.WhatsApp:
      const txtFiles: File[] = [];
      const zipFilesPromises: Promise<File[]>[] = [];

      // Separate text files and handle zip files
      files.forEach(file => {
        if (file.type === "text/plain") {
          txtFiles.push(file);
        } else {
          zipFilesPromises.push(extractTxtFilesFromZip(file));
        }
      });

      resultPromise = Promise.all(zipFilesPromises).then(unzippedFiles =>
        handleWhatsappTxtFiles(txtFiles.concat(unzippedFiles.flat()))
      );
      break;
    case DataSourceValue.Facebook:
      resultPromise = handleFacebookZipFiles(files);
      break;
    case DataSourceValue.Instagram:
      resultPromise = handleInstagramZipFiles(files);
      break;
    case DataSourceValue.IMessage:
      resultPromise = handleImessageDBFiles(files);
      break;
  }

  const result = await resultPromise;

  if (options.skipValidation) {
    return result;
  }

  const checks = getDonationRequirementChecks(result.anonymizedConversations);
  const failures = getFailedDonationRequirementErrors(checks);
  if (failures.length > 0) {
    throw DonationValidationError(failures[0] as DonationErrors);
  }

  return result;
}
