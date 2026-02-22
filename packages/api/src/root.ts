import { createRouter } from "./orpc";
import { analyticsRouter } from "./routers/analytics";
import { calendarRouter } from "./routers/calendar";
import { candidatesRouter } from "./routers/candidates";
import { chatRouter } from "./routers/chat";
import { botRouter } from "./routers/company";
import { customDomainRouter } from "./routers/custom-domain";
import { draftRouter } from "./routers/draft";
import { filesRouter } from "./routers/files";
import { freelancePlatformsRouter } from "./routers/freelance-platforms";
import { funnelRouter } from "./routers/funnel";
import { gigRouter } from "./routers/gig";
import { globalCandidatesRouter } from "./routers/global-candidates";
import { integrationRouter } from "./routers/integration";
import { interviewScenariosRouter } from "./routers/interview-scenarios";
import { metaMatchRouter } from "./routers/meta-match";
import { organizationRouter } from "./routers/organization";
import { paymentRouter } from "./routers/payment";
import { prequalificationRouter } from "./routers/prequalification";
import { recruiterAgentRouter } from "./routers/recruiter-agent";
import { telegramRouter } from "./routers/telegram";
import { testRouter } from "./routers/test";
import { userRouter } from "./routers/user";
import { userIntegrationRouter } from "./routers/user-integration";
import { vacancyRouter } from "./routers/vacancy";
import { widgetConfigRouter } from "./routers/widget-config";
import { workspaceRouter } from "./routers/workspace";
import { registerChatEntities } from "./services/chat/register-entities";

// Регистрация типов сущностей для AI чата
registerChatEntities();

const baseRouter = {
  user: userRouter,
  vacancy: vacancyRouter,
  gig: gigRouter,
  integration: integrationRouter,
  userIntegration: userIntegrationRouter,
  calendar: calendarRouter,
  interviewScenarios: interviewScenariosRouter,
  metaMatch: metaMatchRouter,
  bot: botRouter,
  telegram: telegramRouter,
  workspace: workspaceRouter,
  organization: organizationRouter,
  payment: paymentRouter,
  funnel: funnelRouter,
  candidates: candidatesRouter,
  globalCandidates: globalCandidatesRouter,
  files: filesRouter,
  freelancePlatforms: freelancePlatformsRouter,
  prequalification: prequalificationRouter,
  widgetConfig: widgetConfigRouter,
  analytics: analyticsRouter,
  recruiterAgent: recruiterAgentRouter,
  customDomain: customDomainRouter,
  chat: chatRouter,
  draft: draftRouter,
};

export const appRouter = (
  process.env.NODE_ENV !== "production"
    ? { ...baseRouter, test: testRouter }
    : baseRouter
) as any;

// export type definition of API
export type AppRouter = typeof appRouter;
