import type { PageContext } from "./types";

export function getPageContext(url: string): PageContext | null {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const path = u.pathname;

    if (host === "hh.ru" || host.endsWith(".hh.ru")) {
      if (path.startsWith("/resume/")) {
        return { type: "profile", platform: "HeadHunter" };
      }
      if (
        path.includes("/employer/vacancyresponses") &&
        u.searchParams.get("vacancyId")
      ) {
        return { type: "hh-responses" };
      }
      if (path.includes("/employer/vacancies")) {
        const isActive = !path.includes("/employer/vacancies/archived");
        return { type: "hh-vacancies", isActive };
      }
    }

    if (
      (host === "www.linkedin.com" ||
        host === "linkedin.com" ||
        host.endsWith(".linkedin.com")) &&
      path.startsWith("/in/")
    ) {
      return { type: "profile", platform: "LinkedIn" };
    }
  } catch {
    // ignore
  }
  return null;
}
