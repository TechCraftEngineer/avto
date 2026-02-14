/**
 * API откликов (offers) Kwork
 */
import type { AxiosInstance } from "axios";
import axios from "axios";
import type {
  KworkErrorResponse,
  KworkOffer,
  KworkOffersParams,
} from "./types";

export async function getOffer(
  api: AxiosInstance,
  token: string,
  offerId: number,
): Promise<{
  success: boolean;
  response?: KworkOffer;
  error?: KworkErrorResponse;
}> {
  try {
    const body = new URLSearchParams({ id: String(offerId), token });
    const response = await api.post<
      | { success?: boolean; response?: KworkOffer; code?: number }
      | KworkErrorResponse
    >("offer", body.toString());

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
      response: (data as { response?: KworkOffer })?.response,
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

export async function getOffers(
  api: AxiosInstance,
  token: string,
  params: KworkOffersParams = {},
): Promise<{
  success: boolean;
  response?: KworkOffer[];
  paging?: {
    page: number;
    total: number;
    limit?: number;
    pages?: number;
  };
  error?: KworkErrorResponse;
}> {
  try {
    const body = new URLSearchParams();
    body.append("token", token);
    if (params.page != null) body.append("page", String(params.page));

    const response = await api.post<{
      success?: boolean;
      response?: KworkOffer[];
      paging?: { page: number; total: number; limit?: number; pages?: number };
      code?: number;
    }>("offers", body.toString());

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
      response?: KworkOffer[];
      paging?: { page: number; total: number; limit?: number; pages?: number };
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
