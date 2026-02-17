/**
 * Машина состояний для интеграции с hh.ru
 * Упрощает логику переходов между этапами авторизации
 */

export type HHIntegrationStep =
  | "idle"
  | "verifying"
  | "captcha"
  | "twoFactor"
  | "processing"
  | "success"
  | "error";

export interface HHIntegrationState {
  step: HHIntegrationStep;
  credentials: {
    login: string;
    password: string;
    authType: "password" | "code";
  } | null;
  captchaImageUrl: string | null;
  error: string | null;
}

export type HHIntegrationAction =
  | {
      type: "START_VERIFICATION";
      credentials: HHIntegrationState["credentials"];
    }
  | { type: "REQUIRE_CAPTCHA"; imageUrl: string; message?: string }
  | { type: "REQUIRE_2FA"; message?: string }
  | { type: "CODE_SUBMITTED" }
  | { type: "SUCCESS" }
  | { type: "ERROR"; error: string }
  | { type: "RESET" };

export function hhIntegrationReducer(
  state: HHIntegrationState,
  action: HHIntegrationAction,
): HHIntegrationState {
  switch (action.type) {
    case "START_VERIFICATION":
      return {
        ...state,
        step: "verifying",
        credentials: action.credentials,
        error: null,
      };

    case "REQUIRE_CAPTCHA":
      return {
        ...state,
        step: "captcha",
        captchaImageUrl: action.imageUrl,
        error: action.message ?? null,
      };

    case "REQUIRE_2FA":
      return {
        ...state,
        step: "twoFactor",
        error: action.message ?? null,
      };

    case "CODE_SUBMITTED":
      return {
        ...state,
        step: "processing",
        error: null,
      };

    case "SUCCESS":
      return {
        ...state,
        step: "success",
        error: null,
      };

    case "ERROR":
      return {
        ...state,
        step: "error",
        error: action.error,
      };

    case "RESET":
      return {
        step: "idle",
        credentials: null,
        captchaImageUrl: null,
        error: null,
      };

    default:
      return state;
  }
}

export const initialHHIntegrationState: HHIntegrationState = {
  step: "idle",
  credentials: null,
  captchaImageUrl: null,
  error: null,
};
