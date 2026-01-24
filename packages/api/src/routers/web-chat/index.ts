import type { TRPCRouterRecord } from "@trpc/server";
import { generateWebChatLink } from "./generate-link";
import { getWebChatByToken } from "./get-by-token";

export const webChatRouter = {
  generateLink: generateWebChatLink,
  getByToken: getWebChatByToken,
} satisfies TRPCRouterRecord;
