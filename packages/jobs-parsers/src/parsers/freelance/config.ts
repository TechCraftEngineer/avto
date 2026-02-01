import type { FreelancePlatformConfig, FreelanceSource } from "./types";

/**
 * Конфигурации для различных фриланс-платформ
 */
export const FREELANCE_CONFIGS: Record<
  FreelanceSource,
  FreelancePlatformConfig
> = {
  kwork: {
    name: "Kwork",
    baseUrl: "https://kwork.ru",
    vacanciesUrl: "https://kwork.ru/projects",
  },
  fl: {
    name: "FL.ru",
    baseUrl: "https://www.fl.ru",
    vacanciesUrl: "https://www.fl.ru/projects/",
  },
  freelance: {
    name: "Freelance.ru",
    baseUrl: "https://www.freelance.ru",
    vacanciesUrl: "https://www.freelance.ru/projects/",
  },
};
