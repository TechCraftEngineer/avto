import { log, logError } from "../lib";
import type { Message, MessageType, ServiceWorkerResponse } from "../types";
import { handleApiRequest, handlePing } from "./api";
import { handleFetchChatikChats, handleFetchChatikSearch } from "./chatik";
import { handleFetchImage, validateImageUrl } from "./fetch-image";
import { handleFetchResumePdf, handleFetchResumeText } from "./fetch-resume";
import {
  handleExecuteCheckAndSaveToGlobal,
  handleExecuteImportResponses,
  handleExecuteImportSelectedVacancies,
  handleExecuteImportToSystem,
} from "./import-execution";
import { handleFetchLinkedInDetails } from "./linkedin";

function runAsync(fn: () => Promise<void>): boolean {
  fn();
  return true;
}

export function createMessageHandler(): (
  message: Message,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: ServiceWorkerResponse) => void,
) => boolean {
  return (message, sender, sendResponse) => {
    log("Получено сообщение", { type: message.type, sender: sender.tab?.url });
    const payload = (message.payload ?? {}) as Record<string, unknown>;

    switch (message.type as MessageType) {
      case "API_REQUEST":
        return handleApiRequest(payload, sendResponse);

      case "PING":
        return handlePing(sendResponse);

      case "FETCH_LINKEDIN_DETAILS":
        return runAsync(() =>
          handleFetchLinkedInDetails(payload, sendResponse),
        );

      case "EXECUTE_IMPORT_SELECTED_VACANCIES":
        return runAsync(() =>
          handleExecuteImportSelectedVacancies(payload, sendResponse),
        );

      case "EXECUTE_IMPORT_RESPONSES":
        return runAsync(() =>
          handleExecuteImportResponses(payload, sendResponse),
        );

      case "EXECUTE_IMPORT_TO_SYSTEM":
        return runAsync(() =>
          handleExecuteImportToSystem(payload, sendResponse),
        );

      case "EXECUTE_CHECK_AND_SAVE_TO_GLOBAL":
        return runAsync(() =>
          handleExecuteCheckAndSaveToGlobal(payload, sendResponse),
        );

      case "FETCH_RESUME_PDF":
        return runAsync(() => handleFetchResumePdf(payload, sendResponse));

      case "FETCH_RESUME_TEXT":
        return runAsync(() => handleFetchResumeText(payload, sendResponse));

      case "FETCH_IMAGE": {
        const url = payload?.url;
        if (typeof url !== "string") {
          sendResponse({ success: false, error: "Неверный URL" });
          return false;
        }
        const { valid, error } = validateImageUrl(url);
        if (!valid) {
          sendResponse({ success: false, error });
          return false;
        }
        return runAsync(() => handleFetchImage(payload, sendResponse));
      }

      case "FETCH_CHATIK_CHATS":
        return runAsync(() => handleFetchChatikChats(payload, sendResponse));

      case "FETCH_CHATIK_SEARCH":
        return runAsync(() => handleFetchChatikSearch(payload, sendResponse));

      default:
        logError("Неизвестный тип сообщения", message.type);
        sendResponse({
          success: false,
          error: "Неизвестный тип сообщения",
        });
        return false;
    }
  };
}
