import { describe, expect, it } from "bun:test";
import { getModeConfig } from "./mode-config";

describe("getModeConfig", () => {
  it("должен возвращать корректную конфигурацию для режима archived", () => {
    const config = getModeConfig("archived");
    expect(config.title).toBe("Синхронизация архивных откликов");
    expect(config.description).toContain("Получение всех откликов");
    expect(config.confirmLabel).toBe("Начать синхронизацию");
    expect(config.iconType).toBe("archive");
    expect(config.listItems).toHaveLength(5);
  });

  it("должен возвращать корректную конфигурацию для режима analyze", () => {
    const config = getModeConfig("analyze");
    expect(config.title).toBe("Анализ откликов");
    expect(config.description).toContain("Автоматический анализ");
    expect(config.confirmLabel).toBe("Начать анализ");
    expect(config.iconType).toBe("sparkles");
    expect(config.listItems).toHaveLength(4);
  });

  it("должен возвращать корректную конфигурацию для режима screening", () => {
    const config = getModeConfig("screening");
    expect(config.title).toBe("Скрининг новых откликов");
    expect(config.description).toContain("Автоматический скрининг");
    expect(config.confirmLabel).toBe("Начать скрининг");
    expect(config.iconType).toBe("sparkles");
    expect(config.listItems).toHaveLength(4);
  });

  it("должен возвращать корректную конфигурацию для режима refresh", () => {
    const config = getModeConfig("refresh");
    expect(config.title).toBe("Получение новых откликов");
    expect(config.description).toContain("Получение новых откликов");
    expect(config.confirmLabel).toBe("Получить отклики");
    expect(config.iconType).toBe("download");
    expect(config.listItems).toHaveLength(5);
  });

  it("должен обновлять описание для режима analyze с totalResponses", () => {
    const config = getModeConfig("analyze", 100);
    expect(config.description).toContain("100");
    expect(config.description).toContain("откликов");
  });

  it("не должен изменять описание для других режимов с totalResponses", () => {
    const configRefresh = getModeConfig("refresh", 50);
    expect(configRefresh.description).not.toContain("50");

    const configScreening = getModeConfig("screening", 50);
    expect(configScreening.description).not.toContain("50");

    const configArchived = getModeConfig("archived", 50);
    expect(configArchived.description).not.toContain("50");
  });

  it("должен возвращать уникальные объекты для каждого вызова", () => {
    const config1 = getModeConfig("analyze");
    const config2 = getModeConfig("analyze");
    expect(config1).not.toBe(config2);
  });
});
