// Vacancy repository operations

// Re-export base utilities for convenience
export { unwrap } from "../base/index";
export {
  checkVacancyExists,
  getVacanciesWithoutDescription,
  getVacancyByExternalId,
  getVacancyById,
  hasVacancyDescription,
  saveBasicVacancy,
  saveVacancyToDb,
  updateVacancyDescription,
} from "./vacancy-repository";
// Vacancy requirements
export {
  extractVacancyRequirements,
  getVacancyRequirements,
} from "./vacancy-requirements";
