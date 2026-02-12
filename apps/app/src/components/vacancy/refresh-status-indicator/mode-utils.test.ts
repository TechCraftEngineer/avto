import { describe, expect, it } from "bun:test";
import { checkActiveTask, checkMatchingMode, getModeFlags } from "./mode-utils";

describe("getModeFlags", () => {
  it("должен возвращать корректные флаги для режима archived", () => {
    const result = getModeFlags("archived");
    expect(result.isArchivedMode).toBe(true);
    expect(result.isAnalyzeMode).toBe(false);
    expect(result.isScreeningMode).toBe(false);
  });

  it("должен возвращать корректные флаги для режима analyze", () => {
    const result = getModeFlags("analyze");
    expect(result.isArchivedMode).toBe(false);
    expect(result.isAnalyzeMode).toBe(true);
    expect(result.isScreeningMode).toBe(false);
  });

  it("должен возвращать корректные флаги для режима screening", () => {
    const result = getModeFlags("screening");
    expect(result.isArchivedMode).toBe(false);
    expect(result.isAnalyzeMode).toBe(false);
    expect(result.isScreeningMode).toBe(true);
  });

  it("должен возвращать корректные флаги для режима refresh", () => {
    const result = getModeFlags("refresh");
    expect(result.isArchivedMode).toBe(false);
    expect(result.isAnalyzeMode).toBe(false);
    expect(result.isScreeningMode).toBe(false);
  });
});

describe("checkActiveTask", () => {
  it("должен возвращать true для archived режима с sync-archived событием", () => {
    const result = checkActiveTask("archived", {
      isRunning: true,
      eventType: "vacancy/responses.sync-archived",
    });
    expect(result).toBe(true);
  });

  it("должен возвращать false для archived режима с другим событием", () => {
    const result = checkActiveTask("archived", {
      isRunning: true,
      eventType: "vacancy/responses.refresh",
    });
    expect(result).toBe(false);
  });

  it("должен возвращать false для archived режима без активного задания", () => {
    const result = checkActiveTask("archived", {
      isRunning: false,
      eventType: null,
    });
    expect(result).toBe(false);
  });

  it("должен возвращать true для refresh режима с refresh событием", () => {
    const result = checkActiveTask("refresh", {
      isRunning: true,
      eventType: "vacancy/responses.refresh",
    });
    expect(result).toBe(true);
  });

  it("должен возвращать false для refresh режима с другим событием", () => {
    const result = checkActiveTask("refresh", {
      isRunning: true,
      eventType: "vacancy/responses.sync-archived",
    });
    expect(result).toBe(false);
  });

  it("должен возвращать true для screening режима с screen.new событием", () => {
    const result = checkActiveTask("screening", {
      isRunning: true,
      eventType: "response/screen.new",
    });
    expect(result).toBe(true);
  });

  it("должен возвращать false для screening режима с другим событием", () => {
    const result = checkActiveTask("screening", {
      isRunning: true,
      eventType: "response/screen.batch",
    });
    expect(result).toBe(false);
  });

  it("должен возвращать true для analyze режима с screen.batch событием", () => {
    const result = checkActiveTask("analyze", {
      isRunning: true,
      eventType: "response/screen.batch",
    });
    expect(result).toBe(true);
  });

  it("должен возвращать false для analyze режима с другим событием", () => {
    const result = checkActiveTask("analyze", {
      isRunning: true,
      eventType: "response/screen.new",
    });
    expect(result).toBe(false);
  });

  it("должен возвращать false когда initialStatus=null", () => {
    const result = checkActiveTask("refresh", null);
    expect(result).toBe(false);
  });

  it("должен возвращать false когда initialStatus=undefined", () => {
    const result = checkActiveTask("refresh", undefined);
    expect(result).toBe(false);
  });
});

describe("checkMatchingMode", () => {
  it("должен возвращать true для archived режима с sync-archived событием", () => {
    const result = checkMatchingMode("archived", "vacancy/responses.sync-archived");
    expect(result).toBe(true);
  });

  it("должен возвращать false для archived режима с другим событием", () => {
    const result = checkMatchingMode("archived", "vacancy/responses.refresh");
    expect(result).toBe(false);
  });

  it("должен возвращать true для refresh режима с refresh событием", () => {
    const result = checkMatchingMode("refresh", "vacancy/responses.refresh");
    expect(result).toBe(true);
  });

  it("должен возвращать false для refresh режима с другим событием", () => {
    const result = checkMatchingMode("refresh", "vacancy/responses.sync-archived");
    expect(result).toBe(false);
  });

  it("должен возвращать true для screening режима с screen.new событием", () => {
    const result = checkMatchingMode("screening", "response/screen.new");
    expect(result).toBe(true);
  });

  it("должен возвращать false для screening режима с другим событием", () => {
    const result = checkMatchingMode("screening", "response/screen.batch");
    expect(result).toBe(false);
  });

  it("должен возвращать true для analyze режима с screen.batch событием", () => {
    const result = checkMatchingMode("analyze", "response/screen.batch");
    expect(result).toBe(true);
  });

  it("должен возвращать false для analyze режима с другим событием", () => {
    const result = checkMatchingMode("analyze", "response/screen.new");
    expect(result).toBe(false);
  });

  it("должен возвращать false для любого режима с null событием", () => {
    expect(checkMatchingMode("archived", null)).toBe(false);
    expect(checkMatchingMode("refresh", null)).toBe(false);
    expect(checkMatchingMode("screening", null)).toBe(false);
    expect(checkMatchingMode("analyze", null)).toBe(false);
  });
});
