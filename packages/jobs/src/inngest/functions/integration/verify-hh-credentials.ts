import { upsertIntegration } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";

import { Log } from "crawlee";
import type { Browser } from "puppeteer";
import puppeteer from "puppeteer";
import { performLogin, saveCookies } from "../../../parsers/hh/auth";
import { closeBrowserSafely } from "../../../parsers/hh/browser-utils";
import { HH_CONFIG } from "../../../parsers/hh/config";
import { verifyHHCredentialsChannel } from "../../channels";
import { inngest } from "../../client";

export const verifyHHCredentialsFunction = inngest.createFunction(
  {
    id: "integration-verify-hh-credentials",
    name: "Verify HH Credentials",
  },
  { event: "integration/verify-hh-credentials" },
  async ({ event, step, publish }) => {
    const { email, password, workspaceId } = event.data;

    const result = await step.run("verify-credentials", async () => {
      let browser: Browser | undefined;
      try {
        browser = await puppeteer.launch(HH_CONFIG.puppeteer);

        const page = await browser.newPage();

        await page.setUserAgent({ userAgent: HH_CONFIG.userAgent });

        await page.goto(HH_CONFIG.urls.login, {
          waitUntil: "domcontentloaded",
          timeout: HH_CONFIG.timeouts.navigation,
        });

        await page.waitForNetworkIdle({
          timeout: HH_CONFIG.timeouts.networkIdle,
        });

        const loginInput = await page.$('input[type="text"][name="username"]');

        if (loginInput) {
          const log = new Log();
          await performLogin(page, log, email, password, workspaceId, false);
        } else {
          console.log("✅ Успешно авторизованы");
        }

        // Получаем cookies ДО закрытия браузера
        const cookies = await page.browserContext().cookies();

        // Сначала создаём/обновляем интеграцию с credentials
        await upsertIntegration(db, {
          workspaceId,
          type: "hh",
          name: "HeadHunter",
          credentials: {
            email,
            password,
          },
        });

        // Теперь сохраняем cookies (интеграция уже существует)
        await saveCookies("hh", cookies, workspaceId);
        // Закрываем браузер безопасно
        await closeBrowserSafely(browser);

        const successResult = {
          success: true,
          isValid: true,
        };

        await publish(
          verifyHHCredentialsChannel(workspaceId).result(successResult),
        );

        return successResult;
      } catch (error) {
        if (browser) {
          await closeBrowserSafely(browser);
        }

        const errorMessage =
          error instanceof Error ? error.message : "Неизвестная ошибка";

        if (
          errorMessage.includes("Неверный логин") ||
          errorMessage.includes("пароль") ||
          errorMessage.includes("login")
        ) {
          const errorResult = {
            success: false,
            isValid: false,
            error: "Неверный логин или пароль",
          };

          await publish(
            verifyHHCredentialsChannel(workspaceId).result(errorResult),
          );

          return errorResult;
        }

        const unknownErrorResult = {
          success: false,
          isValid: false,
          error: errorMessage,
        };

        await publish(
          verifyHHCredentialsChannel(workspaceId).result(unknownErrorResult),
        );

        throw error;
      }
    });

    return result;
  },
);
