/**
 * Русская локаль date-fns без «около» в formatDistance.
 * Вместо «около 1 часа назад» показывает «1 час назад».
 */

import type { FormatDistanceToken, Locale } from "date-fns";
import { ru } from "date-fns/locale";

const aboutToPlain: Record<string, string> = {
  aboutXHours: "xHours",
  aboutXWeeks: "xWeeks",
  aboutXMonths: "xMonths",
  aboutXYears: "xYears",
};

if (!ru.formatDistance) throw new Error("ru locale must have formatDistance");
const originalFormatDistance = ru.formatDistance;

const formatDistanceNoAbout: NonNullable<Locale["formatDistance"]> = (
  token,
  count,
  options,
) => {
  const plainToken = (aboutToPlain[token] ?? token) as FormatDistanceToken;
  return originalFormatDistance(plainToken, count, options);
};

export const ruNoAbout: Locale = {
  ...ru,
  formatDistance: formatDistanceNoAbout,
};
