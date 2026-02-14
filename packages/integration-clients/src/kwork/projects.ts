/**
 * API проектов и wants Kwork
 */
import type { AxiosInstance } from "axios";
import axios from "axios";
import type {
  KworkDetails,
  KworkErrorResponse,
  KworkMyWantsParams,
  KworkProject,
  KworkProjectsParams,
  KworkWantPayer,
} from "./types";

export async function getProject(
  api: AxiosInstance,
  token: string,
  projectId: number,
): Promise<{
  success: boolean;
  response?: KworkProject;
  error?: KworkErrorResponse;
}> {
  try {
    const body = new URLSearchParams({ id: String(projectId), token });
    const response = await api.post<{
      success?: boolean;
      response?: KworkProject;
      code?: number;
    }>("project", body.toString());

    const data = response.data;
    if (data && typeof data === "object" && "code" in data && data.code) {
      return { success: false, error: data as KworkErrorResponse };
    }
    return {
      success: true,
      response: (data as { response?: KworkProject })?.response,
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

export async function getProjects(
  api: AxiosInstance,
  token: string,
  params: KworkProjectsParams = {},
): Promise<{
  success: boolean;
  response?: KworkProject[];
  paging?: { page: number; total: number; limit: number };
  error?: KworkErrorResponse;
}> {
  try {
    const body = new URLSearchParams();
    body.append("token", token);
    if (params.categories) body.append("categories", params.categories);
    if (params.price_from != null)
      body.append("price_from", String(params.price_from));
    if (params.price_to != null)
      body.append("price_to", String(params.price_to));
    if (params.page != null) body.append("page", String(params.page));
    if (params.query) body.append("query", params.query);

    const response = await api.post<{
      success?: boolean;
      response?: KworkProject[];
      paging?: { page: number; total: number; limit: number };
      code?: number;
    }>("projects", body.toString());

    const data = response.data;
    if (data && typeof data === "object" && "code" in data && data.code) {
      return { success: false, error: data as KworkErrorResponse };
    }
    const result = data as {
      response?: KworkProject[];
      paging?: { page: number; total: number; limit: number };
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

export async function getWant(
  api: AxiosInstance,
  token: string,
  projectId: number,
): Promise<{
  success: boolean;
  response?: KworkWantPayer[];
  error?: KworkErrorResponse;
}> {
  try {
    const body = new URLSearchParams({ id: String(projectId), token });
    const response = await api.post<
      | { success?: boolean; response?: KworkWantPayer[]; code?: number }
      | KworkErrorResponse
    >("want", body.toString());

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
      response: (data as { response?: KworkWantPayer[] })?.response ?? [],
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

export async function getMyWants(
  api: AxiosInstance,
  token: string,
  params: KworkMyWantsParams = {},
): Promise<{
  success: boolean;
  response?: KworkWantPayer[];
  paging?: { page: number; total: number; pages?: number };
  error?: KworkErrorResponse;
}> {
  try {
    const body = new URLSearchParams();
    body.append("token", token);
    if (params.want_status_id != null)
      body.append("want_status_id", params.want_status_id);
    if (params.page != null) body.append("page", String(params.page));

    const response = await api.post<{
      success?: boolean;
      response?: KworkWantPayer[];
      paging?: { page: number; total: number; pages?: number };
      code?: number;
    }>("myWants", body.toString());

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
      response?: KworkWantPayer[];
      paging?: { page: number; total: number; pages?: number };
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

export async function getKworkDetails(
  api: AxiosInstance,
  kworkId: number,
): Promise<{
  success: boolean;
  response?: KworkDetails;
  error?: KworkErrorResponse;
}> {
  try {
    const body = new URLSearchParams({ id: String(kworkId) });
    const response = await api.post<{
      success?: boolean;
      response?: KworkDetails;
      code?: number;
    }>("getKworkDetails", body.toString());

    const data = response.data;
    if (data && typeof data === "object" && "code" in data && data.code) {
      return { success: false, error: data as KworkErrorResponse };
    }
    return {
      success: true,
      response: (data as { response?: KworkDetails })?.response,
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
