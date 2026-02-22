import type { ResumeStructurerOutput } from "@qbs-autonaim/ai";
import type { HHContacts } from "@qbs-autonaim/jobs";
import { parseBirthDate } from "@qbs-autonaim/lib";
import { formatPhone, normalizePhone } from "@qbs-autonaim/validators";

/**
 * Обрабатывает распарсенные данные резюме из ResumeStructurerAgent
 * Извлекает контакты, дату рождения, опыт работы в годах
 */
export function processResumeStructuredData(
  structuredData: ResumeStructurerOutput,
): {
  contacts: HHContacts | null;
  phone?: string;
  email?: string;
  telegramUsername?: string;
  birthDate?: Date | null;
  experienceYears?: number;
} {
  const result: {
    contacts: HHContacts | null;
    phone?: string;
    email?: string;
    telegramUsername?: string;
    birthDate?: Date | null;
    experienceYears?: number;
  } = {
    contacts: null,
  };

  // Обрабатываем личную информацию
  if (structuredData.personalInfo) {
    const { email, phone, telegram, whatsapp, birthDate } =
      structuredData.personalInfo;

    // Формируем contacts в формате HH
    const contacts: HHContacts = {};

    if (phone) {
      // Нормализуем и форматируем телефон
      const normalizedPhone = normalizePhone(phone);
      const formattedPhone = formatPhone(normalizedPhone);

      contacts.phone = [
        {
          raw: normalizedPhone,
          formatted: formattedPhone,
        },
      ];
      result.phone = normalizedPhone;
      console.log(`✅ Найден телефон: ${phone} -> ${formattedPhone}`);
    }

    if (email) {
      contacts.email = [{ email }];
      result.email = email;
      console.log(`✅ Найден email: ${email}`);
    }

    // Добавляем Telegram и WhatsApp в preferred контакты
    const preferredContacts: Array<{
      type: { id: string; name: string };
      value?: string;
    }> = [];

    if (telegram) {
      const telegramUsername = telegram.startsWith("@")
        ? telegram.slice(1)
        : telegram;
      preferredContacts.push({
        type: { id: "telegram", name: "Telegram" },
        value: telegramUsername,
      });
      result.telegramUsername = telegramUsername;
      console.log(`✅ Найден Telegram: ${telegram}`);
    }

    if (whatsapp) {
      preferredContacts.push({
        type: { id: "whatsapp", name: "WhatsApp" },
        value: whatsapp,
      });
      console.log(`✅ Найден WhatsApp: ${whatsapp}`);
    }

    if (preferredContacts.length > 0) {
      contacts.preferred = preferredContacts;
    }

    if (Object.keys(contacts).length > 0) {
      result.contacts = contacts;
    }

    // Обрабатываем дату рождения
    if (birthDate) {
      const parsedDate = parseBirthDate(birthDate);
      if (parsedDate) {
        result.birthDate = parsedDate;
        console.log(
          `✅ Дата рождения извлечена: ${birthDate} -> ${parsedDate.toISOString()}`,
        );
      } else {
        console.log(`⚠️ Ошибка парсинга даты рождения: ${birthDate}`);
      }
    }
  }

  // Вычисляем опыт работы в годах
  if (structuredData.experience && structuredData.experience.length > 0) {
    const totalMonths = structuredData.experience.reduce((acc, exp) => {
      if (!exp.startDate) return acc;
      const start = new Date(exp.startDate);
      const end = exp.endDate ? new Date(exp.endDate) : new Date();
      const months =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
      return acc + Math.max(0, months);
    }, 0);
    result.experienceYears = Math.floor(totalMonths / 12);
    console.log(`✅ Опыт работы: ${result.experienceYears} лет`);
  }

  return result;
}
