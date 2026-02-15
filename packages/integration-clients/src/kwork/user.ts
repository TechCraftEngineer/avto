/**
 * API профиля пользователя Kwork (/user)
 * Возвращает аватар, описание, рейтинг и другие данные профиля
 */
import type { AxiosInstance } from "axios";
import axios from "axios";
import type { KworkErrorResponse, KworkUser } from "./types";

export async function getUser(
  api: AxiosInstance,
  token: string,
  userId: number,
): Promise<{
  success: boolean;
  response?: KworkUser;
  error?: KworkErrorResponse;
}> {
  try {
    const body = new URLSearchParams({ user_id: String(userId), token });
    const response = await api.post<
      | { success?: boolean; response?: KworkUser; code?: number }
      | KworkErrorResponse
    >("user", body.toString());

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
      response: (data as { response?: KworkUser })?.response,
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
