import { inngest } from "../../inngest/client";
import { createLogger } from "../base";

const logger = createLogger("InngestTriggers");

/**
 * Options for trigger functions
 */
interface TriggerOptions {
  /** Whether to swallow errors instead of rethrowing them (default: false) */
  swallow?: boolean;
}

/**
 * Triggers vacancy requirements extraction job via Inngest
 */
export async function triggerVacancyRequirementsExtraction(
  data: {
    vacancyId: string;
    description: string;
  },
  options: TriggerOptions = {},
): Promise<void> {
  try {
    await inngest.send({
      name: "vacancy/requirements.extract",
      data,
    });
    logger.info(`Event sent for vacancy: ${data.vacancyId}`);
  } catch (error) {
    logger.error("Error sending vacancy/requirements.extract", { error });
    if (!options.swallow) {
      throw error;
    }
  }
}

/**
 * Triggers response screening job via Inngest
 */
export async function triggerResponseScreening(
  data: {
    responseId: string;
  },
  options: TriggerOptions = {},
): Promise<void> {
  try {
    await inngest.send({
      name: "response/screen",
      data,
    });
    logger.info(`Event sent for response: ${data.responseId}`);
  } catch (error) {
    logger.error("Error sending response/screen", { error });
    if (!options.swallow) {
      throw error;
    }
  }
}

/**
 * Triggers active vacancies update job via Inngest
 */
export async function triggerVacanciesUpdate(
  data: {
    workspaceId: string;
  },
  options: TriggerOptions = {},
): Promise<void> {
  try {
    await inngest.send({
      name: "vacancy/update.active",
      data,
    });
    logger.info("Event sent for vacancies update");
  } catch (error) {
    logger.error("Error sending vacancy/update.active", { error });
    if (!options.swallow) {
      throw error;
    }
  }
}

/**
 * Triggers vacancy responses refresh job via Inngest
 */
export async function triggerVacancyResponsesRefresh(data: {
  vacancyId: string;
  workspaceId: string;
}): Promise<void> {
  try {
    await inngest.send({
      name: "vacancy/responses.refresh",
      data,
    });
    logger.info(`Event sent for vacancy responses refresh: ${data.vacancyId}`);
  } catch (error) {
    logger.error("Error sending vacancy/responses.refresh", { error });
    throw error;
  }
}

/**
 * Triggers candidate welcome message job via Inngest
 */
export async function triggerCandidateWelcome(data: {
  responseId: string;
  username: string;
}): Promise<void> {
  try {
    await inngest.send({
      name: "candidate/welcome",
      data,
    });
    logger.info(
      `Event sent for candidate welcome to @${data.username} (response: ${data.responseId})`,
    );
  } catch (error) {
    logger.error("Error sending candidate/welcome", { error });
    throw error;
  }
}

/**
 * Triggers telegram message send job via Inngest
 */
export async function triggerTelegramMessageSend(data: {
  messageId: string;
  chatId: string;
  content: string;
}): Promise<void> {
  try {
    await inngest.send({
      name: "telegram/message.send",
      data,
    });
    logger.info(
      `Event sent for telegram message: ${data.messageId} to chat: ${data.chatId}`,
    );
  } catch (error) {
    logger.error("Error sending telegram/message.send", { error });
    throw error;
  }
}

/**
 * Triggers voice transcription job via Inngest
 */
export async function triggerVoiceTranscription(data: {
  messageId: string;
  fileId: string;
}): Promise<void> {
  try {
    await inngest.send({
      name: "telegram/voice.transcribe",
      data,
    });
    logger.info(`Event sent for voice transcription: ${data.messageId}`);
  } catch (error) {
    logger.error("Error sending telegram/voice.transcribe", { error });
    throw error;
  }
}
