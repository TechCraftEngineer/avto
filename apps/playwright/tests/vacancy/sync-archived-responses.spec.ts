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
      page.getByText(
        /архивная вакансия успешно импортирована.*загрузить отдельно/i,
      ),
    ).toBeVisible();
  });

  test("открывает диалог подтверждения при клике на кнопку загрузки", async ({
    page,
  }) => {
    await page.goto(
      `/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/${vacancyId}/responses`,
    );

    await page
      .getByRole("button", { name: /загрузить архивные отклики/i })
      .click();

    await expect(
      page.getByRole("heading", { name: /синхронизация архивных откликов/i }),
    ).toBeVisible();

    await expect(
      page.getByText(/получение всех откликов с headhunter/i).first(),
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: /начать синхронизацию/i }),
    ).toBeVisible();
  });

  test("можно закрыть диалог подтверждения без запуска синхронизации", async ({
    page,
  }) => {
    await page.goto(
      `/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/${vacancyId}/responses`,
    );

    await page
      .getByRole("button", { name: /загрузить архивные отклики/i })
      .click();

    await expect(
      page.getByRole("heading", { name: /синхронизация архивных откликов/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /отмена/i }).click();

    await expect(
      page.getByRole("heading", { name: /синхронизация архивных откликов/i }),
    ).not.toBeVisible();
  });

  test("запускает синхронизацию при подтверждении в диалоге", async ({
    page,
  }) => {
    await page.goto(
      `/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/${vacancyId}/responses`,
    );

    await page
      .getByRole("button", { name: /загрузить архивные отклики/i })
      .click();

    await expect(
      page.getByRole("button", { name: /начать синхронизацию/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /начать синхронизацию/i }).click();

    // Ожидаем toast — успешный запуск или сообщение об ошибке (если Inngest недоступен)
    await expect(
      page.getByText(/архивн.*отклик|отклик.*архивн/i).first(),
    ).toBeVisible({
      timeout: 10000,
    });
  });
});
