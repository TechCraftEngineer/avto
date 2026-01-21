import { env } from "@qbs-autonaim/config";

export const HH_CONFIG = {
  urls: {
    login:
      "https://hh.ru/account/login?role=employer&backurl=%2F&hhtmFrom=main&hasSwitcher=true&skipSwitcher=true",
    vacancies: "https://hh.ru/employer/vacancies?hhtmFrom=vacancy",
    archivedVacancies: "https://hh.ru/employer/vacancies/archived",
    baseUrl: "https://hh.ru",
  },
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  timeouts: {
    networkIdle: 30000,
    selector: 10000,
    contacts: 10000,
    navigation: 120000,
    requestHandler: 300,
  },
  delays: {
    afterParsing: 5000,
    beforeSubmit: 2000,
    betweenResumes: { min: 3000, max: 8000 }, // Задержка между просмотром резюме
    readingPage: { min: 2000, max: 5000 }, // Время "чтения" страницы
    scrollDelay: { min: 500, max: 1500 }, // Задержка при скролле
  },
  features: {
    parseContacts: true,
  },
  puppeteer: {
    headless: env.NODE_ENV === "production",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-web-security",
      "--disable-features=IsolateOrigins,site-per-process",
      "--window-size=1920,1080",
      "--disable-dev-shm-usage",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
    ] as string[],
    ignoreDefaultArgs: ["--enable-automation"] as string[],
    slowMo: 100,
    handleSIGINT: false,
    handleSIGTERM: false,
    handleSIGHUP: false,
    // Don't use userDataDir to avoid cleanup issues on Windows
    userDataDir: undefined,
  },
};
