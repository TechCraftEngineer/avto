/**
 * Типы каналов общения
 */
export type CommunicationChannel = "HH" | "TELEGRAM" | "WEB_CHAT";

/**
 * Результат отправки сообщения в Telegram
 */
export type SendMessageResponse = {
  success: boolean;
  messageId: string;
  chatId: string;
  senderId: string;
};

/**
 * Данные отклика с вакансией
 */
export type ResponseWithVacancy = any;

/**
 * Результат отправки сообщения
 */
export interface SendResult {
  success: boolean;
  messageId: string;
  chatId: string;
  senderId?: string;
  channel: CommunicationChannel;
  sentMessage: string;
}