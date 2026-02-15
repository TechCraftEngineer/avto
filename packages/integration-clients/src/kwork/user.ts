/**
 * API профиля пользователя Kwork (/user)
 * Возвращает аватар, описание, рейтинг и другие данные профиля
 */
import type { AxiosInstance } from "axios";
import axios from "axios";
import { z } from "zod";
import type { KworkErrorResponse, KworkUser } from "./types";

const KworkUserSchema = z.object({
  id: z.number(),
  username: z.string().optional(),
  status: z.string().optional(),
  fullname: z.string().optional(),
  profilepicture: z.string().optional(),
  description: z.string().optional(),
  slogan: z.string().optional(),
  location: z.string().optional(),
  rating: z.string().optional(),
  rating_count: z.number().optional(),
  level_description: z.string().optional(),
  good_reviews: z.number().optional(),
  bad_reviews: z.number().optional(),
  reviews_count: z.number().optional(),
  online: z.boolean().optional(),
  live_date: z.number().optional(),
  cover: z.string().optional(),
  custom_request_min_budget: z.number().optional(),
  is_allow_custom_request: z.boolean().optional(),
  order_done_persent: z.number().optional(),
  order_done_intime_persent: z.number().optional(),
  order_done_repeat_persent: z.number().optional(),
  timezoneId: z.number().optional(),
  blocked_by_user: z.boolean().optional(),
  allowedDialog: z.boolean().optional(),
  addtime: z.number().optional(),
  achievments_list: z.array(z.unknown()).optional(),
  completed_orders_count: z.number().optional(),
  specialization: z.string().optional(),
  profession: z.string().optional(),
  kworks_count: z.number().optional(),
  kworks: z.array(z.unknown()).optional(),
  portfolio_list: z.unknown().optional(),
  reviews: z.unknown().optional(),
  skills: z.array(z.unknown()).optional(),
  is_verified_worker: z.boolean().optional(),
  note: z.array(z.unknown()).optional(),
  is_cashless_payment_available: z.boolean().optional(),
}).passthrough();

const KworkErrorResponseSchema = z.object({
  code: z.number().optional(),
  message: z.string().optional(),
  recaptcha_pass_token: z.string().optional(),
}).passthrough();

const KworkUserApiResponseSchema = z.object({
  success: z.boolean().optional(),
  response: KworkUserSchema.optional(),
  code: z.number().optional(),
  message: z.string().optional(),
  recaptcha_pass_token: z.string().optional(),
}).passthrough();

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
    const response = await api.post<unknown>("user", body.toString());
    const data = response.data;

    const parsed = z
      .union([KworkUserApiResponseSchema, KworkErrorResponseSchema])
      .safeParse(data);

    if (!parsed.success) {
      return {
        success: false,
        error: {
          message: "Invalid API response format",
        } satisfies KworkErrorResponse,
      };
    }

    const result = parsed.data as z.infer<typeof KworkUserApiResponseSchema> &
      Partial<KworkErrorResponse>;

    if (result.code != null) {
      return {
        success: false,
        error: {
          code: result.code,
          message: result.message,
        } satisfies KworkErrorResponse,
      };
    }

    if (result.success === true && result.response != null) {
      const validatedUser = KworkUserSchema.safeParse(result.response);
      if (!validatedUser.success) {
        return {
          success: false,
          error: {
            message: "Invalid user data in response",
          } satisfies KworkErrorResponse,
        };
      }
      return {
        success: true,
        response: validatedUser.data as KworkUser,
      };
    }

    return {
      success: false,
      error: {
        code: result.code,
        message: result.message ?? "Unknown API error",
      } satisfies KworkErrorResponse,
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
