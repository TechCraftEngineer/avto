import type { RouterOutputs } from "@qbs-autonaim/api";

export type VacancyDetail =
  RouterOutputs["freelancePlatforms"]["getVacancyById"];
export type VacancyPublication = NonNullable<
  VacancyDetail["vacancy"]["publications"]
>[number];
