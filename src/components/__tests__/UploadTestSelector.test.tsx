/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { CONFIG } from "@/config";
import { DataSourceValue } from "@models/processed";

jest.mock("@mui/material/styles/styled", () => ({
  __esModule: true,
  default: () => (component: unknown) => component
}));

jest.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => {
    if (namespace === "urls" && key === "reportProblem") return "https://example.org/report";
    if (namespace === "links" && key === "reportProblem") return "reportProblem";
    return key;
  }
}));

jest.mock("@/hooks/useRichTranslations", () => ({
  useRichTranslations: () => ({
    t: (key: string) => key,
    rich: (key: string) => key
  })
}));

jest.mock("@/services/parsing/shared/aliasConfig", () => ({
  useAliasConfig: () => ({})
}));

const mockAnonymizeData = jest.fn();

jest.mock("@/services/anonymization", () => ({
  anonymizeData: (...args: unknown[]) => mockAnonymizeData(...args)
}));

jest.mock("@/components/DonationComponents", () => ({
  FileUploadButton: ({ onChange }: { onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <input data-testid="file-input" type="file" multiple onChange={onChange} />
  ),
  RemoveButton: ({ onClick }: { onClick: React.MouseEventHandler<HTMLButtonElement> }) => <button onClick={onClick}>remove</button>,
  FileList: ({ files }: { files: File[] }) => <div>{files.map(file => file.name).join(", ")}</div>
}));

function buildValidConversations() {
  const now = Date.now();
  const early = now - CONFIG.MIN_DONATION_TIME_PERIOD_MONTHS * 30 * 24 * 3600 * 1000 - 24 * 3600 * 1000;

  return Array.from({ length: CONFIG.MIN_CHATS_FOR_DONATION }, (_, idx) => ({
    dataSource: DataSourceValue.WhatsApp,
    participants: ["Donor", "Alice"],
    messages: Array.from({ length: CONFIG.MIN_MESSAGES_PER_CHAT }, () => ({
      sender: "Donor",
      timestamp: idx === 0 ? early : now,
      wordCount: 2
    })),
    messagesAudio: [],
    conversationPseudonym: `chat-${idx}`
  }));
}

async function renderSelector(onValidationChange?: (isValid: boolean) => void) {
  const { default: UploadTestSelector } = await import("@/components/UploadTestSelector");
  return render(<UploadTestSelector dataSourceValue={DataSourceValue.WhatsApp} onValidationChange={onValidationChange} />);
}

describe("UploadTestSelector", () => {
  it("shows success when all requirements are fulfilled", async () => {
    const onValidationChange = jest.fn();
    mockAnonymizeData.mockResolvedValueOnce({ anonymizedConversations: buildValidConversations() });

    await renderSelector(onValidationChange);

    const fileInput = screen.getByTestId("file-input");
    fireEvent.change(fileInput, { target: { files: [new File(["hello"], "chat.zip", { type: "application/zip" })] } });

    expect(await screen.findByText("success")).toBeInTheDocument();
    await waitFor(() => expect(onValidationChange).toHaveBeenLastCalledWith(true));
  });

  it("shows requirement failures and opens report link in a new tab", async () => {
    const onValidationChange = jest.fn();
    mockAnonymizeData.mockResolvedValueOnce({
      anonymizedConversations: [
        {
          dataSource: DataSourceValue.WhatsApp,
          participants: ["Donor"],
          messages: [{ sender: "Donor", timestamp: Date.now(), wordCount: 1 }],
          messagesAudio: [],
          conversationPseudonym: "too-small"
        }
      ]
    });

    await renderSelector(onValidationChange);

    const fileInput = screen.getByTestId("file-input");
    fireEvent.change(fileInput, { target: { files: [new File(["hello"], "chat.zip", { type: "application/zip" })] } });

    expect(await screen.findByText(/❌\s+requirements.minChats/)).toBeInTheDocument();
    expect(screen.getByText(/❌\s+requirements.minImportantChats/)).toBeInTheDocument();
    expect(screen.getByText(/❌\s+requirements.minTimePeriod/)).toBeInTheDocument();

    const reportButton = screen.getByRole("link", { name: "reportProblem" });
    expect(reportButton).toHaveAttribute("href", "https://example.org/report");
    expect(reportButton).toHaveAttribute("target", "_blank");
    expect(reportButton).toHaveAttribute("rel", "noopener noreferrer");

    await waitFor(() => expect(onValidationChange).toHaveBeenCalledWith(false));
  });
});
