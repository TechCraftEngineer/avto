import type { ORPCRouterRecord } from "@orpc/server";

import { checkPasswordRouter } from "./auth/auth-check-password";
import { reauthorizeSessionRouter } from "./auth/auth-reauthorize";
import { sendCodeRouter } from "./auth/auth-send-code";
import { signInRouter } from "./auth/auth-sign-in";
import { getAllConversationsRouter } from "./conversation/conversation-get-all";
import { getConversationByIdRouter } from "./conversation/conversation-get-by-id";
import { getConversationByResponseIdRouter } from "./conversation/conversation-get-by-response-id";
import { getConversationByUsernameRouter } from "./conversation/conversation-get-by-username";
import { getFileUrlRouter } from "./file/file-get-url";
import { getMessagesByConversationIdRouter } from "./messages/messages-get-by-conversation-id";
import { getRecentMessagesRouter } from "./messages/messages-get-recent";
import { sendMessageRouter } from "./send/send";
import { sendMutateRouter } from "./send/send-mutate";
import { sendUserMessageByPhoneRouter } from "./send/send-user-by-phone";
import { sendUserMessageRouter } from "./send/send-user-by-username";
import { clearAuthErrorRouter } from "./session/session-clear-error";
import { deleteSessionRouter } from "./session/session-delete";
import { getSessionsRouter } from "./session/session-get-all";
import { getSessionStatusRouter } from "./session/session-get-status";
import { transcribeVoiceRouter } from "./transcribe/transcribe-voice";

export const telegramRouter = {
  conversation: {
    getAll: getAllConversationsRouter,
    getById: getConversationByIdRouter,
    getByResponseId: getConversationByResponseIdRouter,
    getByUsername: getConversationByUsernameRouter,
  },
  messages: {
    getByConversationId: getMessagesByConversationIdRouter,
    getRecent: getRecentMessagesRouter,
  },
  send: {
    send: sendMessageRouter,
    mutate: sendMutateRouter,
  },
  file: {
    getUrl: getFileUrlRouter,
  },
  transcribe: {
    trigger: transcribeVoiceRouter,
  },
  sendCode: sendCodeRouter,
  signIn: signInRouter,
  checkPassword: checkPasswordRouter,
  getSessions: getSessionsRouter,
  deleteSession: deleteSessionRouter,
  getSessionStatus: getSessionStatusRouter,
  clearAuthError: clearAuthErrorRouter,
  reauthorizeSession: reauthorizeSessionRouter,
  sendUserMessage: sendUserMessageRouter,
  sendUserMessageByPhone: sendUserMessageByPhoneRouter,
} satisfies ORPCRouterRecord;
