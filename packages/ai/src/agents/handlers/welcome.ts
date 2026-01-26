/**
 * Агент для генерации приветственного сообщения
 */

import { z } from "zod";
import { type AgentConfig, BaseAgent } from "../core/base-agent";
import { AgentType, type BaseAgentContext } from "../core/types";

export interface WelcomeInput {
  candidateName?: string;
  vacancyTitle?: string;
  gigTitle?: string;
  companyName?: string;
  customWelcomeMessage?: string | null;
  type: 'vacancy' | 'gig';
  channel: string;
}

const welcomeOutputSchema = z.object({
  welcomeMessage: z.string(),
  confidence: z.number().min(0).max(1),
});

export type WelcomeOutput = z.infer<typeof welcomeOutputSchema>;

export class WelcomeAgent extends BaseAgent<WelcomeInput, WelcomeOutput> {
  constructor(config: AgentConfig) {
    const instructions = `Ты — рекрутер, который приветствует кандидата.

ЗАДАЧА:
Создай теплое приветственное сообщение для кандидата, приглашая к интервью через указанный канал.

ПРАВИЛА:
- ОБРАЩЕНИЕ: используй ТОЛЬКО имя кандидата (без фамилии и отчества)
- Если имя не определено или неясно — НЕ обращайся по имени, просто "Добрый день" или "Здравствуйте"
- Упомяни вакансию или gig в зависимости от типа
- Будь дружелюбным и профессиональным
- Пиши естественно, как живой человек
- Обращайся на "вы"
- Используй 1-2 эмодзи для теплоты
- Сообщение должно быть коротким (2-3 предложения)
- Пригласи к интервью через указанный канал

КАНАЛЫ:
Канал может быть любым: Telegram, веб-чат, чат на hh.ru, канал, или любое другое удобное место. Адаптируй приглашение к указанному каналу естественно.

ТИПЫ:
- vacancy: постоянная вакансия
- gig: разовое задание

ПРИМЕРЫ:
- Вакансия, Telegram: "Добрый день, Иван! 👋 Спасибо за отклик на вакансию Frontend Developer. Давайте начнем интервью прямо здесь?"
- Gig, Web-chat: "Здравствуйте, Мария! Рады вашему интересу к заданию UX Designer. Перейдем в наш веб-чат для интервью?"
- Вакансия, hh.ru чат: "Добрый день! 👋 Спасибо за отклик на вакансию. Продолжим общение в чате на hh.ru?"
- Gig, Telegram канал: "Здравствуйте, Анна! Интересуетесь заданием по копирайтингу? Присоединяйтесь к нашему Telegram каналу для интервью."
- Вакансия, без имени, любой канал: "Добрый день! 👋 Спасибо за интерес к вакансии. Давайте познакомимся в удобном для вас формате?"`;

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
    if (input.type === 'vacancy' && !input.vacancyTitle) return false;
    if (input.type === 'gig' && !input.gigTitle) return false;
    return true;
  }

  protected buildPrompt(
    input: WelcomeInput,
    _context: BaseAgentContext,
  ): string {
    const { candidateName, vacancyTitle, gigTitle, companyName, customWelcomeMessage, type, channel } = input;

    const positionText = type === 'vacancy'
      ? (vacancyTitle ? `Вакансия: ${vacancyTitle}` : "Вакансия не указана")
      : (gigTitle ? `Gig: ${gigTitle}` : "Gig не указан");

    const channelText = `Канал для интервью: ${channel}`;

    return `КОНТЕКСТ:
${candidateName ? `Имя кандидата: ${candidateName} (используй ТОЛЬКО это имя, без фамилии)` : "Имя неизвестно (НЕ обращайся по имени)"}
${positionText}
${companyName ? `Компания: ${companyName}` : ""}
${channelText}
${customWelcomeMessage ? `\nКастомное сообщение от работодателя:\n${customWelcomeMessage}` : ""}

Создай приветственное сообщение для кандидата, приглашая к интервью через указанный канал.

Верни JSON с полями:
- welcomeMessage: текст приветствия
- confidence: число от 0.0 до 1.0`;
  }
}
