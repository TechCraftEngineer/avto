/**
 * Unit-тесты и Property-based тесты для ApiClient
 */

import { beforeEach, describe, expect, it, mock } from "bun:test";
import fc from "fast-check";
import type {
  CandidateData,
  ExperienceEntry,
  ImportCandidateResponse,
  Settings,
} from "../shared/types";
import { ApiClient } from "./api-client";

// Mock fetch API
const mockFetch = mock(() => Promise.resolve(new Response()));
global.fetch = mockFetch;

describe("ApiClient", () => {
  let apiClient: ApiClient;
  let settings: Settings;

  beforeEach(() => {
    settings = {
      apiUrl: "https://api.example.com",
      apiToken: "test-token-123",
      organizationId: "org-123",
      fieldsToExtract: {
        basicInfo: true,
        experience: true,
        education: true,
        skills: true,
        contacts: true,
      },
    };
    apiClient = new ApiClient(settings);
    mockFetch.mockClear();
  });

  describe("importCandidate", () => {
    const candidateData: CandidateData = {
      platform: "LinkedIn",
      profileUrl: "https://linkedin.com/in/test",
      basicInfo: {
        fullName: "Иван Петрович Сидоров",
        currentPosition: "Senior Developer",
        location: "Москва, Россия",
        photoUrl: "https://example.com/photo.jpg",
      },
      experience: [
        {
          position: "Senior Developer",
          company: "Tech Corp",
          startDate: "2020-01-01",
          endDate: null,
          description: "Разработка веб-приложений",
        },
        {
          position: "Junior Developer",
          company: "StartUp Inc",
          startDate: "2018-06-01",
          endDate: "2019-12-31",
          description: "Поддержка проектов",
        },
      ],
      education: [
        {
          institution: "МГУ",
          degree: "Бакалавр",
          fieldOfStudy: "Информатика",
          startDate: "2014-09-01",
          endDate: "2018-06-30",
        },
      ],
      skills: ["JavaScript", "TypeScript", "React"],
      contacts: {
        email: "ivan@example.com",
        phone: "+7 (999) 123-45-67",
        socialLinks: ["https://github.com/ivan"],
      },
      extractedAt: new Date("2024-01-15T10:00:00Z"),
    };

    it("должен успешно импортировать кандидата", async () => {
      const mockResponse: ImportCandidateResponse = {
        success: true,
        candidateId: "cand-123",
        candidateOrganizationId: "candorg-456",
      };

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const result = await apiClient.importCandidate(candidateData, "org-123");

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toBe("https://api.example.com/api/candidates/import");
      expect(callArgs[1].method).toBe("POST");
      expect(callArgs[1].headers["Content-Type"]).toBe("application/json");
      expect(callArgs[1].headers.Authorization).toBe("Bearer test-token-123");
    });

    it("должен правильно извлекать имя и фамилию", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 }),
      );

      await apiClient.importCandidate(candidateData, "org-123");

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.candidate.firstName).toBe("Иван");
      expect(requestBody.candidate.lastName).toBe("Сидоров");
    });

    it("должен правильно вычислять опыт работы в годах", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 }),
      );

      await apiClient.importCandidate(candidateData, "org-123");

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      // 2020-01 до сейчас (~4 года) + 2018-06 до 2019-12 (~1.5 года) = ~5-6 лет
      expect(requestBody.candidate.experienceYears).toBeGreaterThanOrEqual(5);
    });

    it("должен правильно преобразовывать платформу LinkedIn", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 }),
      );

      await apiClient.importCandidate(candidateData, "org-123");

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.candidate.originalSource).toBe("LINKEDIN");
    });

    it("должен правильно преобразовывать платформу HeadHunter", async () => {
      const hhData = { ...candidateData, platform: "HeadHunter" };

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 }),
      );

      await apiClient.importCandidate(hhData, "org-123");

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.candidate.originalSource).toBe("HEADHUNTER");
    });

    it("должен использовать LinkedIn по умолчанию для неизвестной платформы", async () => {
      const unknownData = { ...candidateData, platform: "Unknown Platform" };

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 }),
      );

      await apiClient.importCandidate(unknownData, "org-123");

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.candidate.originalSource).toBe("LINKEDIN");
    });

    it("должен выбросить ошибку, если API не настроен (нет URL)", async () => {
      const clientWithoutUrl = new ApiClient({
        ...settings,
        apiUrl: "",
      });

      await expect(
        clientWithoutUrl.importCandidate(candidateData, "org-123"),
      ).rejects.toThrow("API не настроен");
    });

    it("должен выбросить ошибку, если API не настроен (нет токена)", async () => {
      const clientWithoutToken = new ApiClient({
        ...settings,
        apiToken: "",
      });

      await expect(
        clientWithoutToken.importCandidate(candidateData, "org-123"),
      ).rejects.toThrow("API не настроен");
    });

    it("должен обработать ошибку 401 (неавторизован)", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Unauthorized" }), {
          status: 401,
        }),
      );

      await expect(
        apiClient.importCandidate(candidateData, "org-123"),
      ).rejects.toThrow("Ошибка импорта кандидата: Unauthorized");
    });

    it("должен обработать ошибку 403 (доступ запрещен)", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Forbidden" }), {
          status: 403,
        }),
      );

      await expect(
        apiClient.importCandidate(candidateData, "org-123"),
      ).rejects.toThrow("Ошибка импорта кандидата: Forbidden");
    });

    it("должен обработать ошибку 500 (внутренняя ошибка сервера)", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Internal Server Error" }), {
          status: 500,
        }),
      );

      await expect(
        apiClient.importCandidate(candidateData, "org-123"),
      ).rejects.toThrow("Ошибка импорта кандидата: Internal Server Error");
    });

    it("должен обработать ошибку без сообщения в ответе", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({}), {
          status: 400,
          statusText: "Bad Request",
        }),
      );

      await expect(
        apiClient.importCandidate(candidateData, "org-123"),
      ).rejects.toThrow("Ошибка импорта кандидата: Bad Request");
    });

    it("должен обработать сетевую ошибку", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(
        apiClient.importCandidate(candidateData, "org-123"),
      ).rejects.toThrow("Network error");
    });

    it("должен правильно обрабатывать кандидата без контактов", async () => {
      const dataWithoutContacts = {
        ...candidateData,
        contacts: {
          email: null,
          phone: null,
          socialLinks: [],
        },
      };

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 }),
      );

      await apiClient.importCandidate(dataWithoutContacts, "org-123");

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.candidate.email).toBeUndefined();
      expect(requestBody.candidate.phone).toBeUndefined();
    });

    it("должен правильно обрабатывать кандидата без фото", async () => {
      const dataWithoutPhoto = {
        ...candidateData,
        basicInfo: {
          ...candidateData.basicInfo,
          photoUrl: null,
        },
      };

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 }),
      );

      await apiClient.importCandidate(dataWithoutPhoto, "org-123");

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.candidate.photoUrl).toBeUndefined();
    });

    it("должен правильно обрабатывать кандидата без опыта работы", async () => {
      const dataWithoutExperience = {
        ...candidateData,
        experience: [],
      };

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 }),
      );

      await apiClient.importCandidate(dataWithoutExperience, "org-123");

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.candidate.experienceYears).toBe(0);
      expect(requestBody.candidate.profileData.experience).toEqual([]);
    });

    it("должен включать все необходимые поля в запрос", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 }),
      );

      await apiClient.importCandidate(candidateData, "org-123");

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);

      expect(requestBody).toHaveProperty("candidate");
      expect(requestBody).toHaveProperty("organizationId", "org-123");
      expect(requestBody.candidate).toHaveProperty("fullName");
      expect(requestBody.candidate).toHaveProperty("firstName");
      expect(requestBody.candidate).toHaveProperty("lastName");
      expect(requestBody.candidate).toHaveProperty("source", "SOURCING");
      expect(requestBody.candidate).toHaveProperty(
        "parsingStatus",
        "COMPLETED",
      );
      expect(requestBody.candidate).toHaveProperty("originalSource");
    });
  });

  describe("testConnection", () => {
    it("должен вернуть true при успешном подключении", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ status: "ok" }), { status: 200 }),
      );

      const result = await apiClient.testConnection();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/api/health",
        {
          headers: {
            Authorization: "Bearer test-token-123",
          },
        },
      );
    });

    it("должен вернуть false при ошибке подключения", async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 500 }));

      const result = await apiClient.testConnection();

      expect(result).toBe(false);
    });

    it("должен вернуть false при сетевой ошибке", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await apiClient.testConnection();

      expect(result).toBe(false);
    });

    it("должен вернуть false при ошибке 401", async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 401 }));

      const result = await apiClient.testConnection();

      expect(result).toBe(false);
    });

    it("должен вернуть false при ошибке 403", async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 403 }));

      const result = await apiClient.testConnection();

      expect(result).toBe(false);
    });
  });

  describe("extractFirstName", () => {
    it("должен извлечь имя из полного имени", () => {
      // Используем рефлексию для доступа к приватному методу в тестах
      const extractFirstName = (apiClient as any).extractFirstName.bind(
        apiClient,
      );

      expect(extractFirstName("Иван Петров")).toBe("Иван");
      expect(extractFirstName("Мария Ивановна Сидорова")).toBe("Мария");
      expect(extractFirstName("Александр")).toBe("Александр");
      expect(extractFirstName("  Петр  Иванов  ")).toBe("Петр");
    });

    it("должен вернуть пустую строку для пустого имени", () => {
      const extractFirstName = (apiClient as any).extractFirstName.bind(
        apiClient,
      );

      expect(extractFirstName("")).toBe("");
      expect(extractFirstName("   ")).toBe("");
    });
  });

  describe("extractLastName", () => {
    it("должен извлечь фамилию из полного имени", () => {
      const extractLastName = (apiClient as any).extractLastName.bind(
        apiClient,
      );

      expect(extractLastName("Иван Петров")).toBe("Петров");
      expect(extractLastName("Мария Ивановна Сидорова")).toBe("Сидорова");
      expect(extractLastName("  Петр  Иванов  ")).toBe("Иванов");
    });

    it("должен вернуть пустую строку для имени без фамилии", () => {
      const extractLastName = (apiClient as any).extractLastName.bind(
        apiClient,
      );

      expect(extractLastName("Александр")).toBe("");
      expect(extractLastName("")).toBe("");
      expect(extractLastName("   ")).toBe("");
    });
  });

  describe("calculateExperienceYears", () => {
    it("должен вернуть 0 для пустого опыта", () => {
      const calculateExperienceYears = (
        apiClient as any
      ).calculateExperienceYears.bind(apiClient);

      expect(calculateExperienceYears([])).toBe(0);
    });

    it("должен правильно вычислять опыт для завершенных позиций", () => {
      const calculateExperienceYears = (
        apiClient as any
      ).calculateExperienceYears.bind(apiClient);

      const experience: ExperienceEntry[] = [
        {
          position: "Developer",
          company: "Company A",
          startDate: "2020-01-01",
          endDate: "2022-01-01",
          description: "",
        },
      ];

      expect(calculateExperienceYears(experience)).toBe(2);
    });

    it("должен правильно вычислять опыт для текущей позиции", () => {
      const calculateExperienceYears = (
        apiClient as any
      ).calculateExperienceYears.bind(apiClient);

      const experience: ExperienceEntry[] = [
        {
          position: "Developer",
          company: "Company A",
          startDate: "2020-01-01",
          endDate: null,
          description: "",
        },
      ];

      const years = calculateExperienceYears(experience);
      // Должно быть примерно 4-5 лет (с 2020 до сейчас)
      expect(years).toBeGreaterThanOrEqual(4);
    });

    it("должен суммировать опыт с нескольких позиций", () => {
      const calculateExperienceYears = (
        apiClient as any
      ).calculateExperienceYears.bind(apiClient);

      const experience: ExperienceEntry[] = [
        {
          position: "Senior",
          company: "Company A",
          startDate: "2020-01-01",
          endDate: "2022-01-01",
          description: "",
        },
        {
          position: "Junior",
          company: "Company B",
          startDate: "2018-01-01",
          endDate: "2019-06-01",
          description: "",
        },
      ];

      const years = calculateExperienceYears(experience);
      // 2 года + 1.5 года = 3.5 года, округляется до 3
      expect(years).toBe(3);
    });

    it("должен обрабатывать отрицательные даты (возвращать 0)", () => {
      const calculateExperienceYears = (
        apiClient as any
      ).calculateExperienceYears.bind(apiClient);

      const experience: ExperienceEntry[] = [
        {
          position: "Developer",
          company: "Company A",
          startDate: "2022-01-01",
          endDate: "2020-01-01", // Дата окончания раньше начала
          description: "",
        },
      ];

      expect(calculateExperienceYears(experience)).toBe(0);
    });
  });

  describe("mapPlatformToSource", () => {
    it("должен преобразовывать LinkedIn", () => {
      const mapPlatformToSource = (apiClient as any).mapPlatformToSource.bind(
        apiClient,
      );

      expect(mapPlatformToSource("LinkedIn")).toBe("LINKEDIN");
      expect(mapPlatformToSource("linkedin")).toBe("LINKEDIN");
      expect(mapPlatformToSource("LINKEDIN")).toBe("LINKEDIN");
    });

    it("должен преобразовывать HeadHunter", () => {
      const mapPlatformToSource = (apiClient as any).mapPlatformToSource.bind(
        apiClient,
      );

      expect(mapPlatformToSource("HeadHunter")).toBe("HEADHUNTER");
      expect(mapPlatformToSource("headhunter")).toBe("HEADHUNTER");
      expect(mapPlatformToSource("hh.ru")).toBe("HEADHUNTER");
      expect(mapPlatformToSource("HH")).toBe("HEADHUNTER");
    });

    it("должен использовать LinkedIn по умолчанию", () => {
      const mapPlatformToSource = (apiClient as any).mapPlatformToSource.bind(
        apiClient,
      );

      expect(mapPlatformToSource("Unknown")).toBe("LINKEDIN");
      expect(mapPlatformToSource("")).toBe("LINKEDIN");
      expect(mapPlatformToSource("Facebook")).toBe("LINKEDIN");
    });
  });
});

// ============================================================================
// Property-based тесты
// ============================================================================

/**
 * Генератор валидных данных кандидата для property-based тестов
 */
function candidateDataArbitrary(): fc.Arbitrary<CandidateData> {
  return fc.record({
    platform: fc.constantFrom("LinkedIn", "HeadHunter", "linkedin", "hh.ru"),
    profileUrl: fc.webUrl({ validSchemes: ["https"] }),
    basicInfo: fc.record({
      fullName: fc
        .string({ minLength: 2, maxLength: 100 })
        .filter((s) => s.trim().length >= 2),
      currentPosition: fc.string({ maxLength: 200 }),
      location: fc.string({ maxLength: 200 }),
      photoUrl: fc.option(fc.webUrl({ validSchemes: ["https"] }), {
        nil: null,
      }),
    }),
    experience: fc.array(
      fc.record({
        position: fc.string({ minLength: 1, maxLength: 200 }),
        company: fc.string({ minLength: 1, maxLength: 200 }),
        startDate: fc.constant("2020-01-01"),
        endDate: fc.option(fc.constant("2023-12-31"), { nil: null }),
        description: fc.string({ maxLength: 1000 }),
      }),
      { maxLength: 10 },
    ),
    education: fc.array(
      fc.record({
        institution: fc.string({ minLength: 1, maxLength: 200 }),
        degree: fc.string({ maxLength: 200 }),
        fieldOfStudy: fc.string({ maxLength: 200 }),
        startDate: fc.constant("2015-09-01"),
        endDate: fc.constant("2019-06-30"),
      }),
      { maxLength: 5 },
    ),
    skills: fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
      maxLength: 20,
    }),
    contacts: fc.record({
      email: fc.option(fc.emailAddress(), { nil: null }),
      phone: fc.option(fc.string({ minLength: 5, maxLength: 20 }), {
        nil: null,
      }),
      socialLinks: fc.array(fc.webUrl({ validSchemes: ["https"] }), {
        maxLength: 5,
      }),
    }),
    extractedAt: fc.constant(new Date("2024-01-15T10:00:00Z")),
  });
}

/**
 * Генератор валидных настроек для property-based тестов
 */
function settingsArbitrary(): fc.Arbitrary<Settings> {
  return fc.record({
    apiUrl: fc.webUrl({ validSchemes: ["https"] }),
    apiToken: fc
      .string({ minLength: 10, maxLength: 100 })
      .filter((s) => s.trim().length >= 10),
    organizationId: fc
      .string({ minLength: 1, maxLength: 50 })
      .filter((s) => s.trim().length >= 1),
    fieldsToExtract: fc.record({
      basicInfo: fc.boolean(),
      experience: fc.boolean(),
      education: fc.boolean(),
      skills: fc.boolean(),
      contacts: fc.boolean(),
    }),
  });
}

describe("Property-based тесты для ApiClient", () => {
  /**
   * **Валидирует: Требования 10.2**
   *
   * Свойство 9: Включение токена аутентификации
   *
   * Для любого запроса к внешнему API, если интеграция настроена,
   * заголовок Authorization должен содержать токен в формате Bearer {token}.
   */
  it("Property 9: для любого запроса к API заголовок Authorization должен содержать токен в формате Bearer", async () => {
    await fc.assert(
      fc.asyncProperty(
        settingsArbitrary(),
        candidateDataArbitrary(),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (settings, candidateData, organizationId) => {
          // Arrange
          mockFetch.mockClear();
          const client = new ApiClient(settings);
          mockFetch.mockResolvedValueOnce(
            new Response(
              JSON.stringify({
                success: true,
                candidateId: "test-id",
              }),
              { status: 200 },
            ),
          );

          // Act
          await client.importCandidate(candidateData, organizationId);

          // Assert
          expect(mockFetch).toHaveBeenCalledTimes(1);
          const callArgs = mockFetch.mock.calls[0];
          const headers = callArgs[1].headers;

          // Проверяем наличие заголовка Authorization
          expect(headers).toHaveProperty("Authorization");

          // Проверяем формат Bearer {token}
          const authHeader = headers.Authorization;
          expect(authHeader).toMatch(/^Bearer .+$/);

          // Проверяем, что токен соответствует настройкам
          expect(authHeader).toBe(`Bearer ${settings.apiToken}`);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * **Валидирует: Требования 10.2**
   *
   * Свойство 9 (дополнительный тест): testConnection также должен включать токен
   */
  it("Property 9: testConnection должен включать токен в заголовок Authorization", async () => {
    await fc.assert(
      fc.asyncProperty(settingsArbitrary(), async (settings) => {
        // Arrange
        mockFetch.mockClear();
        const client = new ApiClient(settings);
        mockFetch.mockResolvedValueOnce(
          new Response(JSON.stringify({ status: "ok" }), { status: 200 }),
        );

        // Act
        await client.testConnection();

        // Assert
        expect(mockFetch).toHaveBeenCalledTimes(1);
        const callArgs = mockFetch.mock.calls[0];
        const headers = callArgs[1].headers;

        // Проверяем наличие заголовка Authorization
        expect(headers).toHaveProperty("Authorization");

        // Проверяем формат Bearer {token}
        const authHeader = headers.Authorization;
        expect(authHeader).toMatch(/^Bearer .+$/);
        expect(authHeader).toBe(`Bearer ${settings.apiToken}`);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * **Валидирует: Требования 10.2**
   *
   * Свойство 9 (дополнительный тест): токен не должен быть изменен или поврежден
   */
  it("Property 9: токен должен передаваться без изменений", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.webUrl({ validSchemes: ["https"] }),
        fc.string({ minLength: 10, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        candidateDataArbitrary(),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (
          apiUrl,
          apiToken,
          organizationIdSetting,
          candidateData,
          organizationId,
        ) => {
          // Arrange
          mockFetch.mockClear();
          const settings: Settings = {
            apiUrl,
            apiToken,
            organizationId: organizationIdSetting,
            fieldsToExtract: {
              basicInfo: true,
              experience: true,
              education: true,
              skills: true,
              contacts: true,
            },
          };

          const client = new ApiClient(settings);
          mockFetch.mockResolvedValueOnce(
            new Response(
              JSON.stringify({ success: true, candidateId: "test-id" }),
              { status: 200 },
            ),
          );

          // Act
          await client.importCandidate(candidateData, organizationId);

          // Assert
          const callArgs = mockFetch.mock.calls[0];
          const authHeader = callArgs[1].headers.Authorization;

          // Токен должен быть точно таким же, как в настройках
          expect(authHeader).toBe(`Bearer ${apiToken}`);

          // Проверяем, что токен не содержит лишних пробелов или символов
          const extractedToken = authHeader.replace("Bearer ", "");
          expect(extractedToken).toBe(apiToken);
          expect(extractedToken.length).toBe(apiToken.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * **Валидирует: Требования 10.2**
   *
   * Свойство 9 (дополнительный тест): токен должен присутствовать для всех типов запросов
   */
  it("Property 9: токен должен присутствовать во всех типах запросов к API", async () => {
    await fc.assert(
      fc.asyncProperty(settingsArbitrary(), async (settings) => {
        mockFetch.mockClear();
        const client = new ApiClient(settings);

        // Тест 1: importCandidate
        mockFetch.mockResolvedValueOnce(
          new Response(
            JSON.stringify({ success: true, candidateId: "test-id" }),
            { status: 200 },
          ),
        );

        const candidateData: CandidateData = {
          platform: "LinkedIn",
          profileUrl: "https://linkedin.com/in/test",
          basicInfo: {
            fullName: "Test User",
            currentPosition: "Developer",
            location: "Moscow",
            photoUrl: null,
          },
          experience: [],
          education: [],
          skills: [],
          contacts: { email: null, phone: null, socialLinks: [] },
          extractedAt: new Date(),
        };

        await client.importCandidate(candidateData, "org-123");

        const importCallHeaders = mockFetch.mock.calls[0][1].headers;
        expect(importCallHeaders.Authorization).toBe(
          `Bearer ${settings.apiToken}`,
        );

        // Тест 2: testConnection
        mockFetch.mockResolvedValueOnce(
          new Response(JSON.stringify({ status: "ok" }), { status: 200 }),
        );

        await client.testConnection();

        const testCallHeaders = mockFetch.mock.calls[1][1].headers;
        expect(testCallHeaders.Authorization).toBe(
          `Bearer ${settings.apiToken}`,
        );
      }),
      { numRuns: 100 },
    );
  });

  /**
   * **Валидирует: Требования 10.1**
   *
   * Свойство 10: Корректность импорта кандидата
   *
   * Для любых извлеченных данных кандидата, импорт в систему должен создать
   * запись в global_candidates и связать её с организацией через candidate_organizations.
   */
  it("Property 10: импорт должен создавать запись кандидата с привязкой к организации", async () => {
    await fc.assert(
      fc.asyncProperty(
        settingsArbitrary(),
        candidateDataArbitrary(),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (settings, candidateData, organizationId) => {
          // Arrange
          mockFetch.mockClear();
          const client = new ApiClient(settings);

          const mockResponse: ImportCandidateResponse = {
            success: true,
            candidateId: `cand-${Math.random().toString(36).substring(7)}`,
            candidateOrganizationId: `candorg-${Math.random().toString(36).substring(7)}`,
          };

          mockFetch.mockResolvedValueOnce(
            new Response(JSON.stringify(mockResponse), { status: 200 }),
          );

          // Act
          const result = await client.importCandidate(
            candidateData,
            organizationId,
          );

          // Assert - проверяем, что ответ содержит оба ID
          expect(result.success).toBe(true);
          expect(result.candidateId).toBeDefined();
          expect(result.candidateOrganizationId).toBeDefined();

          // Проверяем, что запрос содержит organizationId
          const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
          expect(requestBody.organizationId).toBe(organizationId);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * **Валидирует: Требования 10.1**
   *
   * Свойство 10 (дополнительный тест): все данные кандидата должны быть включены в запрос
   */
  it("Property 10: импорт должен включать все данные кандидата в запрос", async () => {
    await fc.assert(
      fc.asyncProperty(
        settingsArbitrary(),
        candidateDataArbitrary(),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (settings, candidateData, organizationId) => {
          // Arrange
          mockFetch.mockClear();
          const client = new ApiClient(settings);

          mockFetch.mockResolvedValueOnce(
            new Response(
              JSON.stringify({
                success: true,
                candidateId: "test-id",
                candidateOrganizationId: "test-org-id",
              }),
              { status: 200 },
            ),
          );

          // Act
          await client.importCandidate(candidateData, organizationId);

          // Assert
          const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);

          // Проверяем структуру запроса
          expect(requestBody).toHaveProperty("candidate");
          expect(requestBody).toHaveProperty("organizationId", organizationId);

          // Проверяем, что основные данные кандидата присутствуют
          expect(requestBody.candidate.fullName).toBe(
            candidateData.basicInfo.fullName,
          );
          expect(requestBody.candidate.headline).toBe(
            candidateData.basicInfo.currentPosition,
          );
          expect(requestBody.candidate.location).toBe(
            candidateData.basicInfo.location,
          );

          // Проверяем, что опыт и образование включены
          expect(requestBody.candidate.profileData).toHaveProperty(
            "experience",
          );
          expect(requestBody.candidate.profileData).toHaveProperty("education");
          expect(requestBody.candidate.profileData.experience).toEqual(
            candidateData.experience,
          );
          expect(requestBody.candidate.profileData.education).toEqual(
            candidateData.education,
          );

          // Проверяем навыки
          expect(requestBody.candidate.skills).toEqual(candidateData.skills);

          // Проверяем метаданные
          expect(requestBody.candidate.source).toBe("SOURCING");
          expect(requestBody.candidate.parsingStatus).toBe("COMPLETED");
          expect(requestBody.candidate.originalSource).toMatch(
            /^(LINKEDIN|HEADHUNTER)$/,
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * **Валидирует: Требования 10.1**
   *
   * Свойство 10 (дополнительный тест): контакты должны быть корректно обработаны
   */
  it("Property 10: импорт должен корректно обрабатывать контактную информацию", async () => {
    await fc.assert(
      fc.asyncProperty(
        settingsArbitrary(),
        candidateDataArbitrary(),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (settings, candidateData, organizationId) => {
          // Arrange
          mockFetch.mockClear();
          const client = new ApiClient(settings);

          mockFetch.mockResolvedValueOnce(
            new Response(
              JSON.stringify({
                success: true,
                candidateId: "test-id",
                candidateOrganizationId: "test-org-id",
              }),
              { status: 200 },
            ),
          );

          // Act
          await client.importCandidate(candidateData, organizationId);

          // Assert
          const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);

          // Если email есть, он должен быть в запросе
          if (candidateData.contacts.email) {
            expect(requestBody.candidate.email).toBe(
              candidateData.contacts.email,
            );
          } else {
            expect(requestBody.candidate.email).toBeUndefined();
          }

          // Если телефон есть, он должен быть в запросе
          if (candidateData.contacts.phone) {
            expect(requestBody.candidate.phone).toBe(
              candidateData.contacts.phone,
            );
          } else {
            expect(requestBody.candidate.phone).toBeUndefined();
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * **Валидирует: Требования 10.1**
   *
   * Свойство 10 (дополнительный тест): опыт работы должен быть правильно вычислен
   */
  it("Property 10: импорт должен вычислять опыт работы в годах", async () => {
    await fc.assert(
      fc.asyncProperty(
        settingsArbitrary(),
        candidateDataArbitrary(),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (settings, candidateData, organizationId) => {
          // Arrange
          mockFetch.mockClear();
          const client = new ApiClient(settings);

          mockFetch.mockResolvedValueOnce(
            new Response(
              JSON.stringify({
                success: true,
                candidateId: "test-id",
                candidateOrganizationId: "test-org-id",
              }),
              { status: 200 },
            ),
          );

          // Act
          await client.importCandidate(candidateData, organizationId);

          // Assert
          const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);

          // Опыт работы должен быть числом >= 0
          expect(typeof requestBody.candidate.experienceYears).toBe("number");
          expect(requestBody.candidate.experienceYears).toBeGreaterThanOrEqual(
            0,
          );

          // Если нет опыта, должно быть 0
          if (candidateData.experience.length === 0) {
            expect(requestBody.candidate.experienceYears).toBe(0);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * **Валидирует: Требования 10.1**
   *
   * Свойство 10 (дополнительный тест): имя должно быть разделено на firstName и lastName
   */
  it("Property 10: импорт должен разделять полное имя на firstName и lastName", async () => {
    await fc.assert(
      fc.asyncProperty(
        settingsArbitrary(),
        candidateDataArbitrary(),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (settings, candidateData, organizationId) => {
          // Arrange
          mockFetch.mockClear();
          const client = new ApiClient(settings);

          mockFetch.mockResolvedValueOnce(
            new Response(
              JSON.stringify({
                success: true,
                candidateId: "test-id",
                candidateOrganizationId: "test-org-id",
              }),
              { status: 200 },
            ),
          );

          // Act
          await client.importCandidate(candidateData, organizationId);

          // Assert
          const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);

          // firstName и lastName должны быть определены
          expect(requestBody.candidate).toHaveProperty("firstName");
          expect(requestBody.candidate).toHaveProperty("lastName");

          // firstName должно быть первым словом
          const nameParts = candidateData.basicInfo.fullName
            .trim()
            .split(/\s+/);
          expect(requestBody.candidate.firstName).toBe(nameParts[0] || "");

          // lastName должно быть последним словом (или пустым, если имя из одного слова)
          if (nameParts.length > 1) {
            expect(requestBody.candidate.lastName).toBe(
              nameParts[nameParts.length - 1],
            );
          } else {
            expect(requestBody.candidate.lastName).toBe("");
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ============================================================================
// Дополнительные тесты обработки ошибок API
// ============================================================================

describe("Обработка ошибок API", () => {
  let apiClient: ApiClient;
  let settings: Settings;

  beforeEach(() => {
    settings = {
      apiUrl: "https://api.example.com",
      apiToken: "test-token-123",
      organizationId: "org-123",
      fieldsToExtract: {
        basicInfo: true,
        experience: true,
        education: true,
        skills: true,
        contacts: true,
      },
    };
    apiClient = new ApiClient(settings);
    mockFetch.mockClear();
  });

  const candidateData: CandidateData = {
    platform: "LinkedIn",
    profileUrl: "https://linkedin.com/in/test",
    basicInfo: {
      fullName: "Тест Тестов",
      currentPosition: "Developer",
      location: "Москва",
      photoUrl: null,
    },
    experience: [],
    education: [],
    skills: [],
    contacts: { email: null, phone: null, socialLinks: [] },
    extractedAt: new Date(),
  };

  describe("Сетевые ошибки", () => {
    it("должен выбросить ошибку при сбое сети во время импорта", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Failed to fetch"));

      await expect(
        apiClient.importCandidate(candidateData, "org-123"),
      ).rejects.toThrow("Failed to fetch");
    });

    it("должен выбросить ошибку при таймауте запроса", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Request timeout"));

      await expect(
        apiClient.importCandidate(candidateData, "org-123"),
      ).rejects.toThrow("Request timeout");
    });

    it("должен обработать ошибку DNS", async () => {
      mockFetch.mockRejectedValueOnce(new Error("getaddrinfo ENOTFOUND"));

      await expect(
        apiClient.importCandidate(candidateData, "org-123"),
      ).rejects.toThrow("getaddrinfo ENOTFOUND");
    });
  });

  describe("Ошибки аутентификации", () => {
    it("должен обработать ошибку 401 с подробным сообщением", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Токен недействителен" }), {
          status: 401,
        }),
      );

      await expect(
        apiClient.importCandidate(candidateData, "org-123"),
      ).rejects.toThrow("Ошибка импорта кандидата: Токен недействителен");
    });

    it("должен обработать ошибку 403 с подробным сообщением", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ message: "Доступ запрещен для этой организации" }),
          { status: 403 },
        ),
      );

      await expect(
        apiClient.importCandidate(candidateData, "org-123"),
      ).rejects.toThrow(
        "Ошибка импорта кандидата: Доступ запрещен для этой организации",
      );
    });

    it("должен обработать истекший токен", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Токен истек" }), {
          status: 401,
        }),
      );

      await expect(
        apiClient.importCandidate(candidateData, "org-123"),
      ).rejects.toThrow("Ошибка импорта кандидата: Токен истек");
    });
  });

  describe("Ошибки валидации данных", () => {
    it("должен обработать ошибку 400 (неверные данные)", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Поле fullName обязательно" }), {
          status: 400,
        }),
      );

      await expect(
        apiClient.importCandidate(candidateData, "org-123"),
      ).rejects.toThrow("Ошибка импорта кандидата: Поле fullName обязательно");
    });

    it("должен обработать ошибку 422 (невалидные данные)", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            message: "Email имеет неверный формат",
          }),
          { status: 422 },
        ),
      );

      await expect(
        apiClient.importCandidate(candidateData, "org-123"),
      ).rejects.toThrow(
        "Ошибка импорта кандидата: Email имеет неверный формат",
      );
    });
  });

  describe("Ошибки сервера", () => {
    it("должен обработать ошибку 500 (внутренняя ошибка сервера)", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Внутренняя ошибка сервера" }), {
          status: 500,
        }),
      );

      await expect(
        apiClient.importCandidate(candidateData, "org-123"),
      ).rejects.toThrow("Ошибка импорта кандидата: Внутренняя ошибка сервера");
    });

    it("должен обработать ошибку 502 (Bad Gateway)", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Bad Gateway" }), {
          status: 502,
        }),
      );

      await expect(
        apiClient.importCandidate(candidateData, "org-123"),
      ).rejects.toThrow("Ошибка импорта кандидата: Bad Gateway");
    });

    it("должен обработать ошибку 503 (Service Unavailable)", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ message: "Сервис временно недоступен" }),
          { status: 503 },
        ),
      );

      await expect(
        apiClient.importCandidate(candidateData, "org-123"),
      ).rejects.toThrow("Ошибка импорта кандидата: Сервис временно недоступен");
    });

    it("должен обработать ошибку 504 (Gateway Timeout)", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Gateway Timeout" }), {
          status: 504,
        }),
      );

      await expect(
        apiClient.importCandidate(candidateData, "org-123"),
      ).rejects.toThrow("Ошибка импорта кандидата: Gateway Timeout");
    });
  });

  describe("Ошибки конфигурации", () => {
    it("должен выбросить ошибку при отсутствии URL API", async () => {
      const clientWithoutUrl = new ApiClient({
        ...settings,
        apiUrl: "",
      });

      await expect(
        clientWithoutUrl.importCandidate(candidateData, "org-123"),
      ).rejects.toThrow("API не настроен");
    });

    it("должен выбросить ошибку при отсутствии токена", async () => {
      const clientWithoutToken = new ApiClient({
        ...settings,
        apiToken: "",
      });

      await expect(
        clientWithoutToken.importCandidate(candidateData, "org-123"),
      ).rejects.toThrow("API не настроен");
    });

    it("должен выбросить ошибку при отсутствии обоих параметров", async () => {
      const clientWithoutConfig = new ApiClient({
        ...settings,
        apiUrl: "",
        apiToken: "",
      });

      await expect(
        clientWithoutConfig.importCandidate(candidateData, "org-123"),
      ).rejects.toThrow("API не настроен");
    });
  });

  describe("Обработка некорректных ответов", () => {
    it("должен обработать пустой ответ от сервера", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response("", {
          status: 500,
          statusText: "Internal Server Error",
        }),
      );

      await expect(
        apiClient.importCandidate(candidateData, "org-123"),
      ).rejects.toThrow();
    });

    it("должен обработать невалидный JSON в ответе", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response("Invalid JSON {", {
          status: 500,
        }),
      );

      await expect(
        apiClient.importCandidate(candidateData, "org-123"),
      ).rejects.toThrow();
    });

    it("должен использовать statusText если message отсутствует", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({}), {
          status: 404,
          statusText: "Not Found",
        }),
      );

      await expect(
        apiClient.importCandidate(candidateData, "org-123"),
      ).rejects.toThrow("Ошибка импорта кандидата: Not Found");
    });
  });

  describe("testConnection - обработка ошибок", () => {
    it("должен вернуть false при ошибке 401", async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 401 }));

      const result = await apiClient.testConnection();
      expect(result).toBe(false);
    });

    it("должен вернуть false при ошибке 403", async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 403 }));

      const result = await apiClient.testConnection();
      expect(result).toBe(false);
    });

    it("должен вернуть false при ошибке 500", async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 500 }));

      const result = await apiClient.testConnection();
      expect(result).toBe(false);
    });

    it("должен вернуть false при сетевой ошибке", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await apiClient.testConnection();
      expect(result).toBe(false);
    });

    it("должен вернуть false при таймауте", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Timeout"));

      const result = await apiClient.testConnection();
      expect(result).toBe(false);
    });

    it("должен вернуть true только при успешном ответе (200-299)", async () => {
      // Тест 200
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ status: "ok" }), { status: 200 }),
      );
      expect(await apiClient.testConnection()).toBe(true);

      // Тест 201
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ status: "ok" }), { status: 201 }),
      );
      expect(await apiClient.testConnection()).toBe(true);

      // Тест 204
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));
      expect(await apiClient.testConnection()).toBe(true);
    });
  });
});
