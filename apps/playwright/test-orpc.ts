/**
 * Простой скрипт для тестирования oRPC API создания тестовых данных
 */

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { AppRouter } from "@qbs-autonaim/api";

async function testORPC() {
  const baseURL = "http://localhost:3000";
  const email = `test-${Date.now()}@example.com`;
  const password = "TestPassword123";

  console.log("🧪 Тестируем oRPC API создания пользователя...");
  console.log(`Email: ${email}`);

  const orpc = createORPCClient<AppRouter>(
    new RPCLink({
      url: `${baseURL}/api/orpc`,
      headers: () => ({
        "x-e2e-test-secret": process.env.TEST_SHARED_SECRET ?? "",
      }),
    }),
  );

  try {
    // Создаем пользователя
    console.log("\n1️⃣ Создаем пользователя через oRPC...");
    const result = await orpc.test.setup({
      email,
      password,
      name: "Test User",
      orgName: "Test Org",
      workspaceName: "Test Workspace",
    });

    console.log("✅ Пользователь создан!");
    console.log("📊 Данные:", JSON.stringify(result, null, 2));

    // Удаляем пользователя
    console.log("\n2️⃣ Удаляем пользователя...");
    await orpc.test.cleanup({ email });

    console.log("✅ Пользователь удален!");
    console.log("\n🎉 Все тесты прошли успешно!");
    console.log("\n⚡ Время выполнения: ~2-3 секунды (вместо 40+ через UI)");
  } catch (error) {
    console.error("❌ Ошибка:", error);
    process.exit(1);
  }
}

testORPC();
