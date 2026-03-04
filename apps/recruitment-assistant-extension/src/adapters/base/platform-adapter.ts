/**
 * Базовый адаптер для платформ
 *
 * Абстрактный класс, определяющий интерфейс для адаптеров платформ.
 * Каждая поддерживаемая платформа (LinkedIn, HeadHunter) должна реализовать
 * этот класс для извлечения данных из профилей кандидатов.
 */

import type {
  BasicInfo,
  CandidateData,
  ContactInfo,
  EducationEntry,
  ExperienceEntry,
} from "../../shared/types";

/**
 * Абстрактный класс адаптера платформы
 */
export abstract class PlatformAdapter {
  /**
   * Название платформы (например, "LinkedIn", "HeadHunter")
   */
  abstract platformName: string;

  /**
   * Проверяет, является ли текущая страница профилем кандидата
   * @returns true, если это страница профиля на поддерживаемой платформе
   */
  abstract isProfilePage(): boolean;

  /**
   * Извлекает базовую информацию о кандидате
   * @returns Объект с базовой информацией (имя, должность, местоположение, фото)
   */
  abstract extractBasicInfo(): BasicInfo;

  /**
   * Извлекает опыт работы кандидата
   * @returns Массив записей об опыте работы
   */
  abstract extractExperience(): ExperienceEntry[];

  /**
   * Извлекает образование кандидата
   * @returns Массив записей об образовании
   */
  abstract extractEducation(): EducationEntry[];

  /**
   * Извлекает навыки кандидата
   * @returns Массив навыков
   */
  abstract extractSkills(): string[];

  /**
   * Извлекает контактную информацию кандидата
   * @returns Объект с контактной информацией (email, телефон, социальные сети)
   */
  abstract extractContacts(): ContactInfo;

  /**
   * Опциональная подготовка перед извлечением (например, открытие overlay).
   * Вызывается перед extractAll() только для адаптеров с асинхронной подготовкой.
   */
  prepareForExtraction?(): Promise<void>;

  /**
   * Извлекает все данные профиля кандидата
   *
   * Этот метод координирует вызовы всех методов извлечения данных
   * и собирает результаты в единый объект CandidateData.
   *
   * @returns Полный объект данных кандидата
   */
  extractAll(): CandidateData {
    return {
      platform: this.platformName,
      profileUrl: window.location.href,
      basicInfo: this.extractBasicInfo(),
      experience: this.extractExperience(),
      education: this.extractEducation(),
      skills: this.extractSkills(),
      contacts: this.extractContacts(),
      extractedAt: new Date(),
    };
  }
}
