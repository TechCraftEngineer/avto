import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";
import { StatusIcon } from "./status-icon";

describe("StatusIcon", () => {
  it("должен отображать Loader2 для статуса started", () => {
    const { container } = render(<StatusIcon status="started" />);
    const icon = container.querySelector("svg");
    expect(icon).toBeDefined();
  });

  it("должен отображать Loader2 для статуса processing", () => {
    const { container } = render(<StatusIcon status="processing" />);
    const icon = container.querySelector("svg");
    expect(icon).toBeDefined();
  });

  it("должен отображать CheckCircle2 для статуса completed", () => {
    const { container } = render(<StatusIcon status="completed" />);
    const icon = container.querySelector("svg");
    expect(icon).toBeDefined();
  });

  it("должен отображать XCircle для статуса error", () => {
    const { container } = render(<StatusIcon status="error" />);
    const icon = container.querySelector("svg");
    expect(icon).toBeDefined();
  });

  it("должен отображать Loader2 когда статус не передан", () => {
    const { container } = render(<StatusIcon />);
    const icon = container.querySelector("svg");
    expect(icon).toBeDefined();
  });

  it("должен иметь правильные классы для статуса started", () => {
    const { container } = render(<StatusIcon status="started" />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain("bg-blue-500");
  });

  it("должен иметь правильные классы для статуса processing", () => {
    const { container } = render(<StatusIcon status="processing" />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain("bg-blue-500");
  });

  it("должен иметь правильные классы для статуса completed", () => {
    const { container } = render(<StatusIcon status="completed" />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain("bg-green-500");
  });

  it("должен иметь правильные классы для статуса error", () => {
    const { container } = render(<StatusIcon status="error" />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain("bg-red-500");
  });

  it("должен иметь aria-hidden=true", () => {
    const { container } = render(<StatusIcon status="completed" />);
    const div = container.firstChild as HTMLElement;
    expect(div.getAttribute("aria-hidden")).toBe("true");
  });
});
