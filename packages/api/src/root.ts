import { analyticsRouter } from "./routers/analytics";
import { candidatesRouter } from "./routers/candidates";
import { chatRouter } from "./routers/chat";
import { companyRouter } from "./routers/company";
import { customDomainRouter } from "./routers/custom-domain";
import { filesRouter } from "./routers/files";
import { freelancePlatformsRouter } from "./routers/freelance-platforms";
import { funnelRouter } from "./routers/funnel";
import { gigRouter } from "./routers/gig";
import { integrationRouter } from "./routers/integration";
import { interviewScenariosRouter } from "./routers/interview-scenarios";
import { metaMatchRouter } from "./routers/meta-match";
import { organizationRouter } from "./routers/organization";
import { prequalificationRouter } from "./routers/prequalification";
import { recruiterAgentRouter } from "./routers/recruiter-agent";
import { telegramRouter } from "./routers/telegram";
import { testRouter } from "./routers/test";
import { userRouter } from "./routers/user";
import { vacancyRouter } from "./routers/vacancy";
import { widgetConfigRouter } from "./routers/widget-config";
import { workspaceRouter } from "./routers/workspace";
import { webChatRouter } from "./routers/web-chat";
import { registerChatEntities } from "./services/chat/register-entities";
import { createTRPCRouter } from "./trpc";

// Регистрация типов сущностей для AI чата
registerChatEntities();

export const appRouter = createTRPCRouter({
  user: userRouter,
  vacancy: vacancyRouter,
  gig: gigRouter,
  integration: integrationRouter,
  interviewScenarios: interviewScenariosRouter,
  metaMatch: metaMatchRouter,
  company: companyRouter,
  telegram: telegramRouter,
  workspace: workspaceRouter,
  organization: organizationRouter,
  funnel: funnelRouter,
  candidates: candidatesRouter,
  files: filesRouter,
  freelancePlatforms: freelancePlatformsRouter,
  prequalification: prequalificationRouter,
  widgetConfig: widgetConfigRouter,
  analytics: analyticsRouter,
  recruiterAgent: recruiterAgentRouter,
  customDomain: customDomainRouter,
  chat: chatRouter,
  webChat: webChatRouter,
  ...(process.env.NODE_ENV !== "production" && { test: testRouter }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
