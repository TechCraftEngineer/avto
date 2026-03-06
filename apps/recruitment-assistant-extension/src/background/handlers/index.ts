import { log, logError } from "../lib";
import type { Message, ServiceWorkerResponse } from "../types";
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

function runAsync(
  fn: () => Promise<void>,
  sendResponse: (r: ServiceWorkerResponse) => void,
): boolean {
  fn().catch((err) => {
    logError("Ошибка асинхронного обработчика", err);
    sendResponse({ success: false, error: String(err) });
  });
  return true;
}

export function createMessageHandler(): (
  message: Message,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: ServiceWorkerResponse) => void,
) => boolean {
  return (message, sender, sendResponse) => {
    if (
      message == null ||
      typeof message !== "object" ||
      !("type" in message) ||
      typeof (message as { type?: unknown }).type !== "string"
    ) {
      logError("Невалидное сообщение: ожидается объект с полем type", message);
      sendResponse({
        success: false,
        error: "Невалидное сообщение",
      });
      return false;
    }

    log("Получено сообщение", {
      type: (message as Message).type,
      sender: sender.tab?.url,
    });
    const payload = ((message as Message).payload ?? {}) as Record<
      string,
      unknown
    >;

    switch ((message as Message).type) {
      case "API_REQUEST":
        return handleApiRequest(payload, sendResponse);

      case "PING":
        return handlePing(sendResponse);

      case "FETCH_LINKEDIN_DETAILS":
        return runAsync(
          () => handleFetchLinkedInDetails(payload, sendResponse),
          sendResponse,
        );

      case "EXECUTE_IMPORT_SELECTED_VACANCIES":
        return runAsync(
          () => handleExecuteImportSelectedVacancies(payload, sendResponse),
          sendResponse,
        );

      case "EXECUTE_IMPORT_RESPONSES":
        return runAsync(
          () => handleExecuteImportResponses(payload, sendResponse),
          sendResponse,
        );

      case "EXECUTE_IMPORT_TO_SYSTEM":
        return runAsync(
          () => handleExecuteImportToSystem(payload, sendResponse),
          sendResponse,
        );

      case "EXECUTE_CHECK_AND_SAVE_TO_GLOBAL":
        return runAsync(
          () => handleExecuteCheckAndSaveToGlobal(payload, sendResponse),
          sendResponse,
        );

      case "FETCH_RESUME_PDF":
        return runAsync(
          () => handleFetchResumePdf(payload, sendResponse),
          sendResponse,
        );

      case "FETCH_RESUME_TEXT":
        return runAsync(
          () => handleFetchResumeText(payload, sendResponse),
          sendResponse,
        );

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
        return runAsync(
          () => handleFetchImage(payload, sendResponse),
          sendResponse,
        );
      }

      case "FETCH_CHATIK_CHATS":
        return runAsync(
          () => handleFetchChatikChats(payload, sendResponse),
          sendResponse,
        );

      case "FETCH_CHATIK_SEARCH":
        return runAsync(
          () => handleFetchChatikSearch(payload, sendResponse),
          sendResponse,
        );

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
