import { expect, test } from "@playwright/test";
import {
  createArchivedVacancy,
  deleteTestUser,
  setupAuthenticatedTest,
  type TestUser,
} from "../helpers/test-setup";

test.describe("Синхронизация архивных откликов", () => {
  let testUser: TestUser;
  let orgSlug: string;
  let workspaceSlug: string;
  let vacancyId: string;

  test.beforeEach(async ({ page }) => {
    testUser = await setupAuthenticatedTest(page);
    orgSlug = testUser.organization.slug;
    workspaceSlug = testUser.workspace.slug;

    const archivedVacancy = await createArchivedVacancy(testUser);
    vacancyId = archivedVacancy.vacancyId;
  });

  test.afterEach(async () => {
    await deleteTestUser(testUser.email);
  });

  test("отображает кнопку загрузки архивных откликов на странице откликов архивной вакансии", async ({
    page,
  }) => {
    await page.goto(
      `/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/${vacancyId}/responses`,
    );

    await expect(page.getByRole("heading", { name: /отклики/i })).toBeVisible({
      timeout: 15000,
    });

    await expect(
      page.getByRole("button", { name: /загрузить архивные отклики/i }),
    ).toBeVisible({ timeout: 10000 });
  });

  test("показывает текст для архивной вакансии без откликов", async ({
    page,
  }) => {
    await page.goto(
      `/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/${vacancyId}/responses`,
    );

    await expect(page.getByText(/отклики ещё не загружены/i)).toBeVisible({
      timeout: 10000,
    });

    await expect(
      page.getByText(/помощник рекрутера|расширен/i),
    ).toBeVisible();
  });

  test("открывает диалог с информацией о Chrome-расширении при клике", async ({
    page,
  }) => {
    await page.goto(
      `/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/${vacancyId}/responses`,
    );

    await page
      .getByRole("button", { name: /загрузить архивные отклики/i })
      .click();

    await expect(
      page.getByRole("heading", { name: /загрузка архивных откликов/i }),
    ).toBeVisible();

    await expect(
      page.getByText(/помощник рекрутера|chrome/i).first(),
    ).toBeVisible();

    await expect(
      page.getByRole("link", { name: /установить расширение/i }),
    ).toBeVisible();
  });
});
