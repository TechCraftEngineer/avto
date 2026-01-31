// Типы

// Диспетчер
export {
  isFreelancePlatform,
  isVacancySourceSupported,
  parseVacanciesBySource,
  type VacancySource,
} from "./dispatcher";
export * from "./fl";

// Фриланс парсеры
export * from "./freelance";
// HH парсер
export * from "./hh";
// Парсер профилей фрилансеров
export {
  formatProfileDataForStorage,
  type ProfileData,
  parseFreelancerProfile,
  type StoredProfileData,
} from "./profile-parser";
export type {
  ResponseData,
  ResumeExperience,
  SaveResponseData,
  VacancyData,
} from "./types";
// Утилиты безопасности URL
export {
  type SecureFetchOptions,
  secureFetch,
  URLSecurityError,
  type URLValidationOptions,
  validateSecureURL,
  validateSecureURLWithDNS,
} from "./utils/url-security";
