import type { GigAIResponse, GigDocument } from "./types";

export function extractPartialGigResponse(
  text: string,
  fallback?: GigDocument,
): GigAIResponse {
  const result: GigAIResponse = { document: { ...fallback } };

  const cleanText = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");

  const docFields = [
    "title",
    "description",
    "deliverables",
    "requiredSkills",
    "budgetRange",
    "timeline",
  ] as const;

  const startIndex = cleanText.indexOf("{");
  const docText = startIndex >= 0 ? cleanText.slice(startIndex) : cleanText;

  for (const field of docFields) {
    const regex = new RegExp(
      `"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)(?:"|$)`,
      "s",
    );
    const match = docText.match(regex);
    if (match?.[1] && result.document) {
      try {
        result.document[field] = JSON.parse(`"${match[1]}"`);
      } catch {
        result.document[field] = match[1]
          .replace(/\\n/g, "\n")
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, "\\");
      }
    }
  }

  const quickRepliesMatch = docText.match(
    /"quickReplies"\s*:\s*\[([\s\S]*?)\]/,
  );
  if (quickRepliesMatch?.[1]) {
    try {
      const repliesText = `[${quickRepliesMatch[1]}]`;
      const parsed = JSON.parse(repliesText);
      result.quickReplies = Array.isArray(parsed)
        ? parsed.filter((r): r is string => typeof r === "string")
        : [];
    } catch {
      // Ignore parse errors
    }
  }

  return result;
}

export function parseGigAIResponse(
  text: string,
  fallback?: GigDocument,
): { response: GigAIResponse; isComplete: boolean } {
  let cleanText = text.trim();
  if (cleanText.startsWith("```json")) {
    cleanText = cleanText.slice(7);
  } else if (cleanText.startsWith("```")) {
    cleanText = cleanText.slice(3);
  }
  if (cleanText.endsWith("```")) {
    cleanText = cleanText.slice(0, -3);
  }
  cleanText = cleanText.trim();

  const startIndex = cleanText.indexOf("{");
  if (startIndex === -1) {
    return {
      response: extractPartialGigResponse(text, fallback),
      isComplete: false,
    };
  }

  let braceCount = 0;
  let endIndex = -1;

  for (let i = startIndex; i < cleanText.length; i++) {
    const char = cleanText[i];
    if (char === "{") braceCount++;
    else if (char === "}") {
      braceCount--;
      if (braceCount === 0) {
        endIndex = i;
        break;
      }
    }
  }

  if (endIndex === -1) {
    return {
      response: extractPartialGigResponse(cleanText, fallback),
      isComplete: false,
    };
  }

  const jsonText = cleanText.substring(startIndex, endIndex + 1);

  try {
    const parsed = JSON.parse(jsonText);
    const data = parsed as Record<string, unknown>;
    const docData =
      data.document && typeof data.document === "object"
        ? (data.document as Record<string, unknown>)
        : data;

    const getString = (key: string, def = ""): string => {
      const value = docData[key];
      if (value === null || value === undefined) return def;
      return typeof value === "string" ? value : def;
    };

    const response: GigAIResponse = {
      document: {
        title: getString("title", fallback?.title ?? ""),
        description: getString("description", fallback?.description ?? ""),
        deliverables: getString("deliverables", fallback?.deliverables ?? ""),
        requiredSkills: getString(
          "requiredSkills",
          fallback?.requiredSkills ?? "",
        ),
        budgetRange: getString("budgetRange", fallback?.budgetRange ?? ""),
        timeline: getString("timeline", fallback?.timeline ?? ""),
      },
      quickReplies: Array.isArray(data.quickReplies)
        ? data.quickReplies.filter((r): r is string => typeof r === "string")
        : [],
    };

    return { response, isComplete: true };
  } catch {
    return {
      response: extractPartialGigResponse(cleanText, fallback),
      isComplete: false,
    };
  }
}
