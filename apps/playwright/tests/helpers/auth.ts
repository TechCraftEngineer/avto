import type { Page } from "@playwright/test";
import { db, desc, eq, verification } from "@qbs-autonaim/db";

/**
 * Безопасный клик с обходом Next.js dev overlay
 */
export async function safeClick(
  page: Page,
  selector: string,
  options?: { timeout?: number },
) {
  const locator = page.locator(selector);

  try {
    // Сначала пробуем обычный клик
    await locator.click({ timeout: options?.timeout || 5000 });
  } catch (error) {
    // Если не получилось из-за overlay, используем force
    if (
      error.message.includes("nextjs-portal") ||
      error.message.includes("intercepts pointer events")
    ) {
      await locator.click({ force: true });
    } else {
      throw error;
    }
  }
}

/**
 * Безопасный клик по роли с обходом Next.js dev overlay
 */
export async function safeClickByRole(
  page: Page,
  role: string,
  options?: { name?: string; timeout?: number },
) {
  const locator = page.getByRole(
    role as "button" | "link" | "textbox" | "tab",
    { name: options?.name },
  );

  try {
    // Сначала пробуем обычный клик
    await locator.click({ timeout: options?.timeout || 5000 });
  } catch (error) {
    // Если не получилось из-за overlay, используем force
    if (
      error.message.includes("nextjs-portal") ||
      error.message.includes("intercepts pointer events")
    ) {
      await locator.click({ force: true });
    } else {
      throw error;
    }
  }
}

export async function fillEmailPasswordForm(
  page: Page,
  email: string,
  password: string,
) {
  await safeClickByRole(page, "tab", { name: "Пароль" });
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("textbox", { name: "Пароль" }).fill(password);
}

export async function fillEmailOtpForm(page: Page, email: string) {
  await safeClickByRole(page, "tab", { name: "Код на email" });
  await page.getByRole("textbox", { name: "Email" }).fill(email);
}

export async function submitSignInForm(page: Page) {
  await safeClickByRole(page, "button", { name: "Войти" });
}

export async function submitSignUpForm(page: Page) {
  await safeClickByRole(page, "button", { name: "Создать аккаунт" });
}

export async function waitForAuthSuccess(page: Page) {
  await page.waitForURL(
    /\/(orgs\/[^/]+\/workspaces\/[^/]+|invitations|onboarding)/,
    { timeout: 30000 },
  );
}

export async function getOtpFromEmail(email: string): Promise<string> {
  const record = await db
    .select()
    .from(verification)
    .where(eq(verification.identifier, email))
    .orderBy(desc(verification.createdAt))
    .limit(1);

  if (!record[0]) {
    throw new Error(`OTP не найден для email: ${email}`);
  }

  return record[0].value;
}
