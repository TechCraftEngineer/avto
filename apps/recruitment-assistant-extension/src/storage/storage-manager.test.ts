/**
 * Unit-тесты для StorageManager
 */

import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { CandidateData, Settings } from "../shared/types";
import { StorageManager } from "./storage-manager";

// Mock Chrome Storage API
const mockStorage = {
  local: {
    get: mock(() => Promise.resolve({})),
    set: mock(() => Promise.resolve()),
    remove: mock(() => Promise.resolve()),
  },
};

// @ts-expect-error
global.chrome = {
  storage: mockStorage,
};

describe("StorageManager", () => {
  let storageManager: StorageManager;

  beforeEach(() => {
    storageManager = new StorageManager();
    mockStorage.local.get.mockClear();
    mockStorage.local.set.mockClear();
    mockStorage.local.remove.mockClear();
  });

  describe("saveCandidate", () => {
    it("должен сохранить данные кандидата с уникальным ключом", async () => {
      const candidateData: CandidateData = {
        platform: "LinkedIn",
        profileUrl: "https://linkedin.com/in/test",
        basicInfo: {
          fullName: "Иван Иванов",
          currentPosition: "Senior Developer",
          location: "Москва",
          photoUrl: "https://example.com/photo.jpg",
        },
        experience: [],
        education: [],
        skills: [],
        contacts: {
          email: null,
          phone: null,
          socialLinks: [],
        },
        extractedAt: new Date(),
      };

      await storageManager.saveCandidate(candidateData);

      expect(mockStorage.local.set).toHaveBeenCalledTimes(1);
      const callArgs = mockStorage.local.set.mock.calls[0][0];
      const key = Object.keys(callArgs)[0];
      expect(key).toMatch(/^candidate_\d+$/);
      expect(callArgs[key]).toEqual(candidateData);
    });
  });

  describe("getSettings", () => {
    it("должен вернуть сохраненные настройки", async () => {
      const savedSettings: Settings = {
        apiUrl: "https://api.example.com",
        apiToken: "test-token-123",
        fieldsToExtract: {
          basicInfo: true,
          experience: true,
          education: false,
          skills: true,
          contacts: false,
        },
      };

      mockStorage.local.get.mockResolvedValueOnce({ settings: savedSettings });

      const result = await storageManager.getSettings();

      expect(mockStorage.local.get).toHaveBeenCalledWith("settings");
      expect(result).toEqual(savedSettings);
    });

    it("должен вернуть настройки по умолчанию, если настройки не сохранены", async () => {
      mockStorage.local.get.mockResolvedValueOnce({});

      const result = await storageManager.getSettings();

      expect(result).toEqual({
        apiUrl: "",
        apiToken: "",
        fieldsToExtract: {
          basicInfo: true,
          experience: true,
          education: true,
          skills: true,
          contacts: true,
        },
      });
    });
  });

  describe("saveSettings", () => {
    it("должен сохранить настройки в хранилище", async () => {
      const settings: Settings = {
        apiUrl: "https://api.example.com",
        apiToken: "test-token-123",
        fieldsToExtract: {
          basicInfo: true,
          experience: true,
          education: true,
          skills: true,
          contacts: true,
        },
      };

      await storageManager.saveSettings(settings);

      expect(mockStorage.local.set).toHaveBeenCalledWith({ settings });
    });
  });

  describe("clearTemporaryData", () => {
    it("должен удалить все ключи с префиксом temp_", async () => {
      const storageData = {
        settings: { apiUrl: "test" },
        candidate_123: {},
        temp_data1: "value1",
        temp_data2: "value2",
        permanent_data: "value3",
      };

      mockStorage.local.get.mockResolvedValueOnce(storageData);

      await storageManager.clearTemporaryData();

      expect(mockStorage.local.get).toHaveBeenCalledWith(null);
      expect(mockStorage.local.remove).toHaveBeenCalledWith([
        "temp_data1",
        "temp_data2",
      ]);
    });

    it("не должен удалять ничего, если нет временных данных", async () => {
      const storageData = {
        settings: { apiUrl: "test" },
        candidate_123: {},
      };

      mockStorage.local.get.mockResolvedValueOnce(storageData);

      await storageManager.clearTemporaryData();

      expect(mockStorage.local.remove).toHaveBeenCalledWith([]);
    });
  });

  describe("getDefaultSettings", () => {
    it("должен вернуть настройки по умолчанию", () => {
      const defaults = storageManager.getDefaultSettings();

      expect(defaults).toEqual({
        apiUrl: "",
        apiToken: "",
        fieldsToExtract: {
          basicInfo: true,
          experience: true,
          education: true,
          skills: true,
          contacts: true,
        },
      });
    });

    it("должен возвращать новый объект при каждом вызове", () => {
      const defaults1 = storageManager.getDefaultSettings();
      const defaults2 = storageManager.getDefaultSettings();

      expect(defaults1).toEqual(defaults2);
      expect(defaults1).not.toBe(defaults2);
    });
  });
});
