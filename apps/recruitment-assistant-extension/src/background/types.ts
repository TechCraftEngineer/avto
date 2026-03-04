/**
 * Типы сообщений и ответов Service Worker
 */

import type { ApiRequest } from "../shared/types";

export type MessageType =
  | "API_REQUEST"
  | "PING"
  | "FETCH_LINKEDIN_DETAILS"
  | "EXECUTE_IMPORT_SELECTED_VACANCIES"
  | "EXECUTE_IMPORT_RESPONSES"
  | "EXECUTE_IMPORT_TO_SYSTEM"
  | "EXECUTE_CHECK_AND_SAVE_TO_GLOBAL"
  | "FETCH_RESUME_TEXT"
  | "FETCH_RESUME_PDF"
  | "FETCH_IMAGE"
  | "FETCH_CHATIK_CHATS"
  | "FETCH_CHATIK_SEARCH";

export interface Message {
  type: MessageType;
  payload?:
    | ApiRequest
    | { tabId: number }
    | { tabId: number; vacancyId?: string; workspaceId?: string }
    | Record<string, unknown>;
}

export type ServiceWorkerResponse =
  | import("../shared/types").ApiResponse
  | { success: boolean; message?: string; error?: string }
  | { success: boolean; base64?: string; contentType?: string; error?: string }
  | { success: boolean; data?: unknown; error?: string }
  | { ok?: boolean; error?: string };
