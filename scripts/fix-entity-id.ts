import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response } from "@qbs-autonaim/db/schema";

/**
 * Скрипт для исправления entity_id в откликах
 * Обновляет entity_id со старого значения на новое
 */

const OLD_ENTITY_ID = "019c1073-4afe-7627-8fb4-6d4d521c93b1";
const NEW_ENTITY_ID = "019c1f17-0a0d-744a-9b92-7304626ca922";

async function fixEntityId() {
  console.log("🔧 Начинаем исправление entity_id...\n");

  // 1. Подсчитываем количество откликов для обновления
  const responsesToUpdate = await db.query.response.findMany({
    where: eq(response.entityId, OLD_ENTITY_ID),
    columns: {
      id: true,
      candidateName: true,
    },
  });

  console.log(
    `📊 Найдено откликов для обновления: ${responsesToUpdate.length}`,
  );

  if (responsesToUpdate.length === 0) {
    console.log("✅ Нет откликов для обновления");
    return;
  }

  console.log(`\n🔄 Обновляем entity_id:`);
  console.log(`  Старый: ${OLD_ENTITY_ID}`);
  console.log(`  Новый:  ${NEW_ENTITY_ID}\n`);

  // 2. Обновляем entity_id
  try {
    const result = await db
      .update(response)
      .set({ entityId: NEW_ENTITY_ID })
      .where(eq(response.entityId, OLD_ENTITY_ID));

    console.log(`✅ Обновлено откликов: ${result.rowCount || 0}`);

    // 3. Проверяем результат
    const remainingOrphaned = await db.query.response.findMany({
      where: eq(response.entityId, OLD_ENTITY_ID),
    });

    if (remainingOrphaned.length === 0) {
      console.log("\n✅ Все отклики успешно обновлены!");
    } else {
      console.log(
        `\n⚠️  Осталось откликов со старым entity_id: ${remainingOrphaned.length}`,
      );
    }

    // 4. Проверяем новые отклики
    const updatedResponses = await db.query.response.findMany({
      where: eq(response.entityId, NEW_ENTITY_ID),
    });

    console.log(
      `\n📊 Всего откликов с новым entity_id: ${updatedResponses.length}`,
    );
  } catch (error) {
    console.error("\n❌ Ошибка при обновлении:", error);
    throw error;
  }
}

fixEntityId()
  .then(() => {
    console.log("\n🎉 Исправление завершено успешно");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Ошибка выполнения скрипта:", error);
    process.exit(1);
  });
