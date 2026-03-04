import type { ParsedResume } from "@qbs-autonaim/db";
import type { CreateGlobalCandidateFormValues } from "@qbs-autonaim/validators";

export function formatPeriod(start?: string, end?: string): string {
  if (!start && !end) return "";
  if (start && end) return `${start} — ${end}`;
  return start ?? end ?? "";
}

export function parsedResumeToFormValues(
  parsed: ParsedResume,
): Partial<CreateGlobalCandidateFormValues> {
  const pi = parsed.structured?.personalInfo;
  const exp = parsed.structured?.experience ?? [];
  const edu = parsed.structured?.education ?? [];
  const skills = parsed.structured?.skills ?? [];
  const languages = parsed.structured?.languages ?? [];

  let experienceYears: number | undefined;
  if (exp.length > 0) {
    const now = new Date();
    let earliestYear = now.getFullYear();
    for (const e of exp) {
      const startMatch = e.startDate?.match(/(\d{4})/);
      if (startMatch?.[1]) {
        const startYear = parseInt(startMatch[1], 10);
        if (startYear < earliestYear) earliestYear = startYear;
      }
    }
    experienceYears = Math.max(0, now.getFullYear() - earliestYear);
  }

  const headline = exp.length
    ? (exp[exp.length - 1]?.position ?? undefined)
    : undefined;
  const piExt = pi as { birthDate?: string } | undefined;

  const englishLang = languages.find(
    (l) =>
      l.name.toLowerCase().includes("english") ||
      l.name.toLowerCase().includes("английский"),
  );
  const levelUpper = englishLang?.level?.toUpperCase();
  const englishLevel =
    levelUpper && ["A1", "A2", "B1", "B2", "C1", "C2"].includes(levelUpper)
      ? (levelUpper as "A1" | "A2" | "B1" | "B2" | "C1" | "C2")
      : undefined;

  const experience =
    exp.length > 0
      ? exp.map((e) => ({
          company: e.company ?? "",
          position: e.position ?? "",
          period: formatPeriod(e.startDate, e.endDate),
          description: e.description,
        }))
      : undefined;

  const education =
    edu.length > 0
      ? edu.map((e) => ({
          institution: e.institution,
          degree: e.degree,
          field: e.field,
          period: formatPeriod(e.startDate, e.endDate),
          startDate: e.startDate,
          endDate: e.endDate,
        }))
      : undefined;

  return {
    fullName: pi?.name ?? "",
    email: pi?.email ?? undefined,
    phone: pi?.phone ?? undefined,
    location: pi?.location ?? undefined,
    birthDate: piExt?.birthDate
      ? (() => {
          try {
            const d = new Date(piExt.birthDate);
            return Number.isNaN(d.getTime()) ? undefined : d;
          } catch {
            return undefined;
          }
        })()
      : undefined,
    gender: (() => {
      const g = pi?.gender?.toLowerCase();
      return g === "male" || g === "female"
        ? (g as "male" | "female")
        : undefined;
    })(),
    citizenship: pi?.citizenship ?? undefined,
    headline: headline ?? undefined,
    skills: skills.length > 0 ? skills : undefined,
    experienceYears: experienceYears ?? undefined,
    englishLevel: englishLevel ?? undefined,
    experience,
    education,
  };
}
