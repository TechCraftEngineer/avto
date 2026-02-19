/**
 * Скрипт для нормализации телефонных номеров в базе данных
 * Преобразует номера в формат E.164 используя libphonenumber-js
 */

import { eq, isNotNull } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { globalCandidate, response } from "@qbs-autonaim/db/schema";
import { normalizePhone } from "@qbs-autonaim/validators";

async function normalizeResponsePhones() {
  console.log("🔄 Нормализация телефонов в таблице responses...");

  const responses = await db
    .select({ id: response.id, phone: response.phone })
    .from(response)
    .where(isNotNull(response.phone));

  console.log(`📊 Найдено откликов с телефонами: ${responses.length}`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const resp of responses) {
    if (!resp.phone) continue;

    try {
      const normalized = normalizePhone(resp.phone);

      // Обновляем только если изменилось
      if (normalized !== resp.phone) {
        await db
          .update(response)
          .set({ phone: normalized })
          .where(eq(response.id, resp.id));

        updated++;
        console.log(`  ✅ ${resp.phone} → ${normalized}`);
      } else {
        skipped++;
      }
    } catch (error) {
      errors++;
      console.error(`  ❌ Ошибка при обработке ${resp.phone}:`, error);
    }
  }

  console.log(
    `✅ Обновлено: ${updated}, пропущено: ${skipped}, ошибок: ${errors}`,
  );
}

async function normalizeCandidatePhones() {
  console.log("\n🔄 Нормализация телефонов в таблице global_candidates...");

  const candidates = await db
    .select({ id: globalCandidate.id, phone: globalCandidate.phone })
    .from(globalCandidate)
    .where(isNotNull(globalCandidate.phone));

  console.log(`📊 Найдено кандидатов с телефонами: ${candidates.length}`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const cand of candidates) {
    if (!cand.phone) continue;

    try {
      const normalized = normalizePhone(cand.phone);

      if (normalized !== cand.phone) {
        await db
          .update(globalCandidate)
          .set({ phone: normalized })
          .where(eq(globalCandidate.id, cand.id));

        updated++;
        console.log(`  ✅ ${cand.phone} → ${normalized}`);
      } else {
        skipped++;
      }
    } catch (error) {
      errors++;
      console.error(`  ❌ Ошибка при обработке ${cand.phone}:`, error);
    }
  }

  console.log(
    `✅ Обновлено: ${updated}, пропущено: ${skipped}, ошибок: ${errors}`,
  );
}

async function main() {
  console.log("🚀 Запуск нормализации телефонных номеров\n");

  try {
    await normalizeResponsePhones();
    await normalizeCandidatePhones();

    console.log("\n✅ Нормализация завершена успешно!");
  } catch (error) {
    console.error("❌ Ошибка при нормализации:", error);
    process.exit(1);
  }
}

main();
