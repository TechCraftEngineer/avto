/**
 * Тесты для базового адаптера платформы
 */

import { describe, expect, it } from "vitest";
import type {
  BasicInfo,
  ContactInfo,
  EducationEntry,
  ExperienceEntry,
} from "../../shared/types";
import { PlatformAdapter } from "./platform-adapter";

/**
 * Тестовая реализация PlatformAdapter для проверки базового функционала
 */
class TestPlatformAdapter extends PlatformAdapter {
  platformName = "TestPlatform";

  isProfilePage(): boolean {
    return true;
  }

  extractBasicInfo(): BasicInfo {
    return {
      fullName: "Иван Иванов",
      currentPosition: "Senior Developer",
      location: "Москва, Россия",
      photoUrl: "https://example.com/photo.jpg",
    };
  }

  extractExperience(): ExperienceEntry[] {
    return [
      {
        position: "Senior Developer",
        company: "Tech Company",
        startDate: "2020-01",
        endDate: null,
        description: "Разработка веб-приложений",
      },
    ];
  }

  extractEducation(): EducationEntry[] {
    return [
      {
        institution: "МГУ",
        degree: "Бакалавр",
        fieldOfStudy: "Информатика",
        startDate: "2015",
        endDate: "2019",
      },
    ];
  }

  extractSkills(): string[] {
    return ["TypeScript", "React", "Node.js"];
  }

  extractContacts(): ContactInfo {
    return {
      email: "ivan@example.com",
      phone: "+7 (999) 123-45-67",
      socialLinks: ["https://github.com/ivan"],
    };
  }
}

describe("PlatformAdapter", () => {
  describe("extractAll", () => {
    it("должен извлечь все данные профиля", () => {
      // Arrange
      const adapter = new TestPlatformAdapter();

      // Act
      const result = adapter.extractAll();

      // Assert
      expect(result.platform).toBe("TestPlatform");
      expect(result.profileUrl).toBe("about:blank"); // В тестовой среде
      expect(result.basicInfo.fullName).toBe("Иван Иванов");
      expect(result.experience).toHaveLength(1);
      expect(result.education).toHaveLength(1);
      expect(result.skills).toHaveLength(3);
      expect(result.contacts.email).toBe("ivan@example.com");
      expect(result.extractedAt).toBeInstanceOf(Date);
    });

    it("должен включать текущий URL страницы", () => {
      // Arrange
      const adapter = new TestPlatformAdapter();

      // Act
      const result = adapter.extractAll();

      // Assert
      expect(result.profileUrl).toBe(window.location.href);
    });

    it("должен включать время извлечения", () => {
      // Arrange
      const adapter = new TestPlatformAdapter();
      const beforeExtraction = new Date();

      // Act
      const result = adapter.extractAll();
      const afterExtraction = new Date();

      // Assert
      expect(result.extractedAt.getTime()).toBeGreaterThanOrEqual(
        beforeExtraction.getTime(),
      );
      expect(result.extractedAt.getTime()).toBeLessThanOrEqual(
        afterExtraction.getTime(),
      );
    });

    it("должен вызывать все методы извлечения данных", () => {
      // Arrange
      const adapter = new TestPlatformAdapter();
      let basicInfoCalled = false;
      let experienceCalled = false;
      let educationCalled = false;
      let skillsCalled = false;
      let contactsCalled = false;

      adapter.extractBasicInfo = () => {
        basicInfoCalled = true;
        return {
          fullName: "Test",
          currentPosition: "Test",
          location: "Test",
          photoUrl: null,
        };
      };

      adapter.extractExperience = () => {
        experienceCalled = true;
        return [];
      };

      adapter.extractEducation = () => {
        educationCalled = true;
        return [];
      };

      adapter.extractSkills = () => {
        skillsCalled = true;
        return [];
      };

      adapter.extractContacts = () => {
        contactsCalled = true;
        return {
          email: null,
          phone: null,
          socialLinks: [],
        };
      };

      // Act
      adapter.extractAll();

      // Assert
      expect(basicInfoCalled).toBe(true);
      expect(experienceCalled).toBe(true);
      expect(educationCalled).toBe(true);
      expect(skillsCalled).toBe(true);
      expect(contactsCalled).toBe(true);
    });
  });
});
