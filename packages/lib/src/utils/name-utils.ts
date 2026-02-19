/**
 * Парсинг полного имени (ФИО) на компоненты.
 * Учитывает формат РФ: "Фамилия Имя Отчество" при 3+ частях.
 */
export function parseFullName(fullName: string | null): {
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
} {
  if (!fullName || fullName.trim().length === 0) {
    return {
      firstName: null,
      lastName: null,
      middleName: null,
    };
  }

  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 0);

  if (parts.length === 0) {
    return {
      firstName: null,
      lastName: null,
      middleName: null,
    };
  }

  if (parts.length === 1) {
    return {
      firstName: parts[0] ?? null,
      lastName: null,
      middleName: null,
    };
  }

  if (parts.length === 2) {
    return {
      firstName: parts[0] ?? null,
      lastName: parts[1] ?? null,
      middleName: null,
    };
  }

  // 3+ части — считаем формат РФ: Фамилия Имя Отчество
  return {
    firstName: parts[1] ?? null,
    lastName: parts[0] ?? null,
    middleName: parts.slice(2).join(" ") || null,
  };
}
