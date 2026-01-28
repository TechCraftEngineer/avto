import type { Page } from "@playwright/test";

export async function navigateToWorkspaceSettings(
  page: Page,
  orgSlug: string,
  workspaceSlug: string,
) {
  await page.goto(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings`);
  await page.waitForLoadState("networkidle");
}

export async function navigateToWorkspaceMembers(
  page: Page,
  orgSlug: string,
  workspaceSlug: string,
) {
  await page.goto(
    `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/members`,
  );
  await page.waitForLoadState("networkidle");
}

export async function navigateToWorkspaceIntegrations(
  page: Page,
  orgSlug: string,
  workspaceSlug: string,
) {
  await page.goto(
    `/orgs/${orgSlug}/workspaces/${workspaceSlug}/settings/integrations`,
  );
  await page.waitForLoadState("networkidle");
}

export async function updateWorkspaceName(
  page: Page,
  newName: string,
): Promise<void> {
  const nameInput = page.getByLabel("Название рабочего пространства");
  await nameInput.clear();
  await nameInput.fill(newName);
  await page.getByRole("button", { name: "Сохранить изменения" }).click();
}

export async function updateWorkspaceSlug(
  page: Page,
  newSlug: string,
): Promise<void> {
  const slugInput = page.getByLabel("Адрес пространства");
  await slugInput.clear();
  await slugInput.fill(newSlug);
  await page.getByRole("button", { name: "Сохранить изменения" }).click();
}

export async function searchMembers(page: Page, query: string): Promise<void> {
  const searchInput = page.getByPlaceholder("Поиск по имени или email");
  await searchInput.fill(query);
}

export async function filterMembersByRole(
  page: Page,
  role: "all" | "owner" | "admin" | "member",
): Promise<void> {
  await page.getByRole("combobox").first().click();

  const roleMap = {
    all: "Все роли",
    owner: "Владелец",
    admin: "Администратор",
    member: "Участник",
  };

  await page.getByRole("option", { name: roleMap[role] }).click();
}

export async function openInviteMemberDialog(page: Page): Promise<void> {
  await page.getByRole("button", { name: /Пригласить/ }).click();
  await page.waitForTimeout(500);
}

export async function openDeleteWorkspaceDialog(page: Page): Promise<void> {
  await page
    .getByRole("button", { name: "Удалить рабочее пространство" })
    .click();
  await page.waitForTimeout(500);
}

export async function getWorkspaceSlugsFromUrl(
  page: Page,
): Promise<{ orgSlug: string; workspaceSlug: string } | null> {
  await page.waitForURL(/\/orgs\/[^/]+\/workspaces\/[^/]+/, {
    timeout: 15000,
  });
  const url = page.url();
  const match = url.match(/\/orgs\/([^/]+)\/workspaces\/([^/]+)/);

  if (match && match[1] && match[2]) {
    return {
      orgSlug: match[1],
      workspaceSlug: match[2],
    };
  }

  return null;
}
