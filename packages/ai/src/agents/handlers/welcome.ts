/**
 * Агент для генерации приглашения на интервью
 */

import { z } from "zod";
import { type AgentConfig, BaseAgent } from "../core/base-agent";
import { AgentType, type BaseAgentContext } from "../core/types";

export interface WelcomeInput {
  candidateName?: string;
  vacancyTitle?: string;
  gigTitle?: string;
  companyName?: string;
  companyDescription?: string | null;
  webChatUrl?: string;
  type: "vacancy" | "gig";
  channel: string;
}

const welcomeOutputSchema = z.object({
  welcomeMessage: z.string(),
  confidence: z.number().min(0).max(1),
});

export type WelcomeOutput = z.infer<typeof welcomeOutputSchema>;

export class WelcomeAgent extends BaseAgent<WelcomeInput, WelcomeOutput> {
  constructor(config: AgentConfig) {
    const instructions = `Ты — рекрутер, который приглашает кандидата на интервью.

ЗАДАЧА:
Создай приглашение на интервью для кандидата. Сообщение отправляется в чат HH.ru — это не приветствие, а именно приглашение пройти интервью по ссылке.

ПРАВИЛА:
- ОБРАЩЕНИЕ: используй ТОЛЬКО имя кандидата (без фамилии и отчества)
- Если имя не определено или неясно — НЕ обращайся по имени, просто "Добрый день" или "Здравствуйте"
- Упомяни вакансию или gig в зависимости от типа
- Будь дружелюбным и профессиональным
- Пиши естественно, как живой человек
- Обращайся на "вы"
- Используй 1-2 эмодзи для теплоты
- Сообщение должно быть коротким (2-3 предложения)
- ОБЯЗАТЕЛЬНО: если предоставлена ссылка на интервью (веб-чат), включи её в сообщение — кандидат должен перейти по ссылке для прохождения интервью
- Фрейминг: это приглашение на интервью, а не просто приветствие

КАНАЛЫ:
Канал может быть любым: Telegram, веб-чат, чат на hh.ru. Для hh-webchat-invite: сообщение идёт в чат HH.ru и приглашает перейти по ссылке на веб-интервью.

ТИПЫ:
- vacancy: постоянная вакансия
- gig: разовое задание

ПРИМЕРЫ (приглашение с ссылкой на интервью):
- Вакансия, веб-чат: "Добрый день, Иван! 👋 Спасибо за отклик. Приглашаем вас на интервью — перейдите по ссылке: [ссылка]"
- Gig, веб-чат: "Здравствуйте, Мария! Рады вашему интересу. Пройдите интерактивное интервью по ссылке: [ссылка]"
- Вакансия, hh.ru, с ссылкой: "Добрый день! 👋 Благодарим за отклик. Приглашаем пройти интервью — нажмите на ссылку для перехода: [ссылка]"
- Вакансия, без имени: "Добрый день! 👋 Спасибо за интерес. Приглашаем на интервью по ссылке: [ссылка]"
- Telegram: "Добрый день! 👋 Давайте начнём интервью прямо здесь в Telegram?"`;

    super(
      "Welcome",
      AgentType.SCREENER,
      instructions,
      welcomeOutputSchema,
      config,
    );
  }

  protected validate(input: WelcomeInput): boolean {
    // Проверяем, что для vacancy есть vacancyTitle, для gig - gigTitle
    // Исключение: для канала "hh-webchat-invite" vacancyTitle не требуется,
    // так как сообщение отправляется в HH.ru чат, где контекст уже понятен
    if (input.channel === "hh-webchat-invite") return true;
    if (input.type === "vacancy" && !input.vacancyTitle) return false;
    if (input.type === "gig" && !input.gigTitle) return false;
    return true;
  }

  protected buildPrompt(
    input: WelcomeInput,
    _context: BaseAgentContext,
  ): string {
    const {
      candidateName,
      vacancyTitle,
      gigTitle,
      companyName,
      companyDescription,
      webChatUrl,
      type,
      channel,
    } = input;
    console.log(input);
    // Для канала "hh-webchat-invite" указываем минимальный контекст,
    // так как сообщение отправляется в HH.ru чат, где контекст уже понятен
    const isHHWebChatInvite = channel === "hh-webchat-invite";

    const positionText = isHHWebChatInvite
      ? type === "vacancy"
        ? "Вакансия"
        : "Гиг"
      : type === "vacancy"
        ? vacancyTitle
          ? `Вакансия: ${vacancyTitle}`
          : "Вакансия не указана"
        : gigTitle
          ? `Гиг: ${gigTitle}`
          : "Гиг не указан";

    const channelText = `Канал для интервью: ${channel}`;

    return `КОНТЕКСТ:
${candidateName ? `Имя кандидата: ${candidateName} (используй ТОЛЬКО это имя, без фамилии)` : "Имя неизвестно (НЕ обращайся по имени)"}
${positionText}
${companyName ? `Компания: ${companyName}` : ""}
${channelText}
${companyDescription ? `\nОписание компании:\n${companyDescription}` : ""}
${webChatUrl ? `\nСсылка на интервью (ОБЯЗАТЕЛЬНО включи в сообщение): ${webChatUrl}` : ""}

Создай приглашение на интервью для кандидата. Если указана ссылка — обязательно включи её в текст.

Верни JSON с полями:
- welcomeMessage: текст приглашения на интервью
- confidence: число от 0.0 до 1.0`;
  }
}
