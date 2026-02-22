import type { db } from "@qbs-autonaim/db/client";
import type { Browser, Page } from "puppeteer";

export interface TwoFactorRequiredResult {
  success: boolean;
  isValid: boolean;
  requiresTwoFactor: boolean;
  twoFactorType?: "email" | "phone";
  message?: string;
}

export interface TwoFactorCodeResult {
  success: boolean;
  isValid: boolean;
  error?: string;
}

export type VerifyCredentialsStepResult =
  | { success: true; isValid: true }
  | { success: false; isValid: false; requiresTwoFactor: true }
  | { success: false; isValid: false; error: string };

// biome-ignore lint/suspicious/noExplicitAny: compatible with Inngest Realtime PublishFn which expects Input
export type PublishFn = (event: any) => Promise<unknown>;

export interface AuthContext {
  page: Page;
  browser: Browser;
  dbInstance: typeof db;
  workspaceId: string;
  publish: PublishFn;
  sleep: (ms: number) => Promise<void>;
  pollTimeoutMs: number;
  pollIntervalMs: number;
}

export interface AuthEventData {
  email: string;
  password?: string;
  workspaceId: string;
  authType?: "password" | "code";
  verificationCode?: string;
}
