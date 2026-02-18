/**
 * Хранение выбранных вакансий в chrome.storage
 */

const SELECTED_VACANCIES_STORAGE_KEY = "hh-selected-vacancy-ids";

export async function getSelectedIds(): Promise<Set<string>> {
  const r = await chrome.storage.local.get(SELECTED_VACANCIES_STORAGE_KEY);
  const arr = r[SELECTED_VACANCIES_STORAGE_KEY] as string[] | undefined;
  return new Set(arr ?? []);
}

export async function setSelectedIds(ids: Set<string>): Promise<void> {
  await chrome.storage.local.set({
    [SELECTED_VACANCIES_STORAGE_KEY]: [...ids],
  });
}

export async function toggleSelection(externalId: string): Promise<void> {
  const ids = await getSelectedIds();
  if (ids.has(externalId)) ids.delete(externalId);
  else ids.add(externalId);
  await setSelectedIds(ids);
}
