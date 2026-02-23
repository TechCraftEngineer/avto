/**
 * Устанавливает значение по вложенному пути в объекте.
 * Поддерживает пути вида "basicInfo.fullName" и "experience.0.position".
 */

export function setNestedValue(
  obj: Record<string, unknown>,
  path: string[],
  value: unknown,
): void {
  if (path.length === 0) return;

  const firstKey = path[0];
  if (firstKey === undefined) return;

  if (path.length === 1) {
    obj[firstKey] = value;
    return;
  }

  const currentKey = firstKey;
  const remainingPath = path.slice(1);
  const nextKey = remainingPath[0];
  const isArrayIndex =
    nextKey !== undefined && !Number.isNaN(Number.parseInt(nextKey, 10));

  if (!obj[currentKey] || typeof obj[currentKey] !== "object") {
    obj[currentKey] = isArrayIndex ? [] : {};
  }

  setNestedValue(
    obj[currentKey] as Record<string, unknown>,
    remainingPath,
    value,
  );
}
