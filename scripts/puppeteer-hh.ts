import puppeteer from "puppeteer";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

async function main() {
  const cookiesPath = process.argv[2] || "./scripts/cookies.json";

  let cookies: Array<{ name: string; value: string; domain: string }>;
  try {
    cookies = JSON.parse(readFileSync(resolve(cookiesPath), "utf-8"));
  } catch (_error) {
    console.error("Не удалось загрузить cookies из файла:", cookiesPath);
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  const page = await browser.newPage();

  await page.setCookie(...cookies);

  await page.goto("https://hh.ru", { waitUntil: "networkidle2" });

  console.log(
    "Браузер запущен с cookies. Закройте окно браузера для завершения.",
  );
}

main().catch(console.error);
