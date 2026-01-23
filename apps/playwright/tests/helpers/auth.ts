import type { Page } from "@playwright/test";
import { db, verification } from "@qbs-autonaim/db";
import { desc, eq } from "@qbs-autonaim/db";

export async function fillEmailPasswordForm(
  page: Page,
  email: string,
  password: string,
) {
  await page.getByRole("tab", { name: "Пароль" }).click();
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("textbox", { name: "Пароль" }).fill(password);
}

export async function fillEmailOtpForm(page: Page, email: string) {
  await page.getByRole("tab", { name: "Код на email" }).click();
  await page.getByRole("textbox", { name: "Email" }).fill(email);
}

export async function submitSignInForm(page: Page) {
  await page.getByRole("button", { name: "Войти" }).click();
}

export async function submitSignUpForm(page: Page) {
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
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
