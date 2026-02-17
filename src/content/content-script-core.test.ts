/**
 * Unit-тесты для основной логики Content Script
 * Тестируем инициализацию, определение платформы, UI setup, и взаимодействие с кнопками
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HeadHunterAdapter } from "../adapters/headhunter/headhunter-adapter";
import { LinkedInAdapter } from "../adapters/linkedin/linkedin-adapter";
import { ContentScript } from "./content-script";

describe("ContentScript - Инициализация и определение платформы", () => {
  beforeEach(() => {
    // Очищаем DOM перед каждым тестом
    document.body.innerHTML = "";
    
    // Mock для window.location
    delete (window as any).location;
    window.location = { pathname: "/" } as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("init", () => {
    it("должен инициализироваться только один раз", async () => {
      // Arrange
      const contentScript = new (ContentScript as any)();
      const checkIfSupportedPageSpy = vi.spyOn(
        contentScript,
        "checkIfSupportedPage",
      );

      // Act
      await contentScript
