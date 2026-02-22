/**
 * API переписки (inbox) Kwork
 */
import type { AxiosInstance } from "axios";
import axios from "axios";
import type {
  KworkDialog,
  KworkDialogsParams,
  KworkErrorResponse,
  KworkInboxMessage,
  KworkInboxTracksParams,
} from "./types";

export async function getDialogs(
  api: AxiosInstance,
  token: string,
  params: KworkDialogsParams = {},
): Promise<{
  success: boolean;
  response?: KworkDialog[];
  paging?: { page?: number; total?: number; pages?: number };
  error?: KworkErrorResponse;
}> {
  try {
    const body = new URLSearchParams();
    body.append("token", token);
    if (params.page != null) body.append("page", String(params.page));
    if (params.excludedIds) body.append("excludedIds", params.excludedIds);

    const response = await api.post<
      | {
          success?: boolean;
          response?: KworkDialog[];
          paging?: { page?: number; total?: number; pages?: number };
          code?: number;
        }
      | KworkErrorResponse
    >("dialogs", body.toString());

    const data = response.data;
    if (
      data &&
      typeof data === "object" &&
      "code" in data &&
      (data as KworkErrorResponse).code
    ) {
      return { success: false, error: data as KworkErrorResponse };
    }
    const result = data as {
      response?: KworkDialog[];
      paging?: { page?: number; total?: number; pages?: number };
    };
    return {
      success: true,
      response: result?.response ?? [],
      paging: result?.paging,
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      return {
        success: false,
        error: error.response.data as KworkErrorResponse,
      };
    }
    throw error;
  }
}

export async function getDialog(
  api: AxiosInstance,
  token: string,
  userId: number,
): Promise<{
  success: boolean;
  response?: unknown;
  error?: KworkErrorResponse;
}> {
  try {
    const body = new URLSearchParams({ id: String(userId), token });
    const response = await api.post<
      | { success?: boolean; response?: unknown; code?: number }
      | KworkErrorResponse
    >("getDialog", body.toString());

    const data = response.data;
    if (
      data &&
      typeof data === "object" &&
      "code" in data &&
      (data as KworkErrorResponse).code
    ) {
      return { success: false, error: data as KworkErrorResponse };
    }
    return {
      success: true,
      response: (data as { response?: unknown })?.response,
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      return {
        success: false,
        error: error.response.data as KworkErrorResponse,
      };
    }
    throw error;
  }
}

export async function sendMessage(
  api: AxiosInstance,
  token: string,
  userId: number,
  text: string,
): Promise<{
  success: boolean;
  response?: { id?: number; conversation_id?: number; type?: string };
  error?: KworkErrorResponse;
}> {
  try {
    const body = new URLSearchParams();
    body.append("token", token);
    body.append("user_id", String(userId));
    body.append("text", text);

    const response = await api.post<
      | {
          success?: boolean;
          response?: {
            id?: number;
            conversation_id?: number;
            type?: string;
          };
          code?: number;
        }
      | KworkErrorResponse
    >("inboxCreate", body.toString());

    const data = response.data;
    if (
      data &&
      typeof data === "object" &&
      "code" in data &&
      (data as KworkErrorResponse).code
    ) {
      return { success: false, error: data as KworkErrorResponse };
    }
    return {
      success: true,
      response: (
        data as {
          response?: {
            id?: number;
            conversation_id?: number;
            type?: string;
          };
        }
      )?.response,
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      return {
        success: false,
        error: error.response.data as KworkErrorResponse,
      };
    }
    throw error;
  }
}

export async function getInboxTracks(
  api: AxiosInstance,
  token: string,
  params: KworkInboxTracksParams = {},
): Promise<{
  success: boolean;
  response?: KworkInboxMessage[];
  paging?: { page?: number; total?: number };
  user?: { user_id?: number; username?: string };
  error?: KworkErrorResponse;
}> {
  try {
    const body = new URLSearchParams();
    body.append("token", token);
    if (params.userId != null) body.append("userId", String(params.userId));
    if (params.username) body.append("username", params.username);
    if (params.page != null) body.append("page", String(params.page));
    if (params.lastConversationId != null)
      body.append("lastConversationId", String(params.lastConversationId));
    if (params.direction) body.append("direction", params.direction);
    if (params.limit != null) body.append("limit", String(params.limit));

    const response = await api.post<
      | {
          success?: boolean;
          response?: KworkInboxMessage[];
          paging?: { page?: number; total?: number };
          user?: { user_id?: number; username?: string };
          code?: number;
        }
      | KworkErrorResponse
    >("getInboxTracks", body.toString());

    const data = response.data;
    if (
      data &&
      typeof data === "object" &&
      "code" in data &&
      (data as KworkErrorResponse).code
    ) {
      return { success: false, error: data as KworkErrorResponse };
    }
    const result = data as {
      response?: KworkInboxMessage[];
      paging?: { page?: number; total?: number };
      user?: { user_id?: number; username?: string };
    };
    return {
      success: true,
      response: result?.response ?? [],
      paging: result?.paging,
      user: result?.user,
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      return {
        success: false,
        error: error.response.data as KworkErrorResponse,
      };
    }
    throw error;
  }
}

export async function getInboxMessage(
  api: AxiosInstance,
  token: string,
  messageId: number,
): Promise<{
  success: boolean;
  response?: KworkInboxMessage[];
  error?: KworkErrorResponse;
}> {
  try {
    const body = new URLSearchParams({
      messageId: String(messageId),
      token,
    });
    const response = await api.post<
      | { success?: boolean; response?: KworkInboxMessage[]; code?: number }
      | KworkErrorResponse
    >("inboxMessage", body.toString());

    const data = response.data;
    if (
      data &&
      typeof data === "object" &&
      "code" in data &&
      (data as KworkErrorResponse).code
    ) {
      return { success: false, error: data as KworkErrorResponse };
    }
    return {
      success: true,
      response: (data as { response?: KworkInboxMessage[] })?.response ?? [],
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      return {
        success: false,
        error: error.response.data as KworkErrorResponse,
      };
    }
    throw error;
  }
}
