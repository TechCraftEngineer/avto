import { checkPasswordRouter } from "./auth/check-password";
import { sendCodeRouter } from "./auth/send-code";
import { signInRouter } from "./auth/sign-in";
import { deleteSessionRouter } from "./delete-session";
import { getSessionsRouter } from "./get-sessions";
import { listMessagesRouter } from "./list-messages";
import { sendMessageRouter } from "./send-message";

export const personalTelegramRouter = {
  sendCode: sendCodeRouter,
  signIn: signInRouter,
  checkPassword: checkPasswordRouter,
  deleteSession: deleteSessionRouter,
  sendMessage: sendMessageRouter,
  listMessages: listMessagesRouter,
  getSessions: getSessionsRouter,
};
