/**
 * Unit-тесты для StorageManager
 * Настройки убраны — остались saveCandidate и clearTemporaryData
 */

import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { CandidateData } from "../shared/types";
import { StorageManager } from "./storage-manager";

const mockStorage = {
  local: {
    get: mock(() => Promise.resolve({})),
    set: mock(() => Promise.resolve()),
    remove: mock(() => Promise.resolve()),
  },
};

// @ts-expect-error
global.chrome = { storage: mockStorage };

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

  describe("clearTemporaryData", () => {
    it("должен удалить все ключи с префиксом temp_", async () => {
      const storageData = {
        authToken: "token",
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
        authToken: "token",
        candidate_123: {},
      };

      mockStorage.local.get.mockResolvedValueOnce(storageData);

      await storageManager.clearTemporaryData();

      expect(mockStorage.local.remove).toHaveBeenCalledWith([]);
    });
  });
});
