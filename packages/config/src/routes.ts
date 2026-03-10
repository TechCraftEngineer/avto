const ROOTS = {
  DASHBOARD: "/",
  AUTH: "/auth",
  ACCOUNT: "/account",
  ONBOARDING: "/onboarding",
  INVITATIONS: "/invitations",
  INVITE: "/invite",
  ACCESS_DENIED: "/access-denied",
} as const;

export const ROUTE_SEGMENTS = {
  vacancy: {
    edit: "edit",
    detail: "detail",
    settings: "settings",
    responses: "responses",
    integrations: "integrations",
    interview: "interview",
  },
  gig: {
    edit: "edit",
    detail: "detail",
    settings: "settings",
    responses: "responses",
  },
} as const;

export const paths = {
  dashboard: {
    root: ROOTS.DASHBOARD,
  },
  auth: {
    root: ROOTS.AUTH,
    signin: `${ROOTS.AUTH}/signin`,
    signup: `${ROOTS.AUTH}/signup`,
    otp: `${ROOTS.AUTH}/otp`,
    signout: `${ROOTS.AUTH}/signout`,
    forgotPassword: `${ROOTS.AUTH}/forgot-password`,
    resetPassword: `${ROOTS.AUTH}/reset-password`,
    verifyEmail: `${ROOTS.AUTH}/verify-email`,
  },
  account: {
    root: ROOTS.ACCOUNT,
    settings: `${ROOTS.ACCOUNT}/settings`,
    integrations: `${ROOTS.ACCOUNT}/settings/integrations`,
    settingsSection: (section: string) =>
      `${ROOTS.ACCOUNT}/settings/${section}`,
  },
  payment: {
    root: "/payment",
    create: "/payment/create",
    detail: (id: string) => `/payment/${id}`,
  },
  workspace: {
    root: (orgSlug: string, slug: string) =>
      `/orgs/${orgSlug}/workspaces/${slug}`,
    candidates: (orgSlug: string, slug: string) =>
      `/orgs/${orgSlug}/workspaces/${slug}/candidates`,
    chat: (orgSlug: string, slug: string, candidateId?: string) =>
      candidateId
        ? `/orgs/${orgSlug}/workspaces/${slug}/chat/${candidateId}`
        : `/orgs/${orgSlug}/workspaces/${slug}/chat`,
    funnel: (orgSlug: string, slug: string) =>
      `/orgs/${orgSlug}/workspaces/${slug}/funnel`,
    responses: (orgSlug: string, slug: string, responseId?: string) =>
      responseId
        ? `/orgs/${orgSlug}/workspaces/${slug}/responses/${responseId}`
        : `/orgs/${orgSlug}/workspaces/${slug}/responses`,
    vacancies: (
      orgSlug: string,
      slug: string,
      vacancyId?: string,
      section?:
        | "detail"
        | "settings"
        | "responses"
        | "edit"
        | "integrations"
        | "shortlist"
        | "interview",
    ) => {
      const base = `/orgs/${orgSlug}/workspaces/${slug}/vacancies`;
      if (!vacancyId) return base;
      if (section) return `${base}/${vacancyId}/${section}`;
      return `${base}/${vacancyId}`;
    },
    createVacancy: (orgSlug: string, slug: string) =>
      `/orgs/${orgSlug}/workspaces/${slug}/vacancies/create`,
    vacancyResponse: (
      orgSlug: string,
      slug: string,
      vacancyId: string,
      responseId: string,
    ) =>
      `/orgs/${orgSlug}/workspaces/${slug}/vacancies/${vacancyId}/responses/${responseId}`,
    gigs: (
      orgSlug: string,
      slug: string,
      gigId?: string,
      section?: "detail" | "settings" | "responses" | "edit" | "shortlist",
    ) => {
      const base = `/orgs/${orgSlug}/workspaces/${slug}/gigs`;
      if (!gigId) return base;
      if (section) return `${base}/${gigId}/${section}`;
      return `${base}/${gigId}`;
    },
    gigChat: (
      orgSlug: string,
      slug: string,
      gigId: string,
      sessionId?: string,
    ) =>
      sessionId
        ? `/orgs/${orgSlug}/workspaces/${slug}/gigs/${gigId}/chat/${sessionId}`
        : `/orgs/${orgSlug}/workspaces/${slug}/gigs/${gigId}/chat`,
    gigResponse: (
      orgSlug: string,
      slug: string,
      gigId: string,
      responseId: string,
    ) =>
      `/orgs/${orgSlug}/workspaces/${slug}/gigs/${gigId}/responses/${responseId}`,
    settings: {
      root: (orgSlug: string, slug: string) =>
        `/orgs/${orgSlug}/workspaces/${slug}/settings`,
      bot: (orgSlug: string, slug: string) =>
        `/orgs/${orgSlug}/workspaces/${slug}/settings/bot`,
      integrations: (orgSlug: string, slug: string) =>
        `/orgs/${orgSlug}/workspaces/${slug}/settings/integrations`,
      members: (orgSlug: string, slug: string) =>
        `/orgs/${orgSlug}/workspaces/${slug}/settings/members`,
      telegram: (orgSlug: string, slug: string) =>
        `/orgs/${orgSlug}/workspaces/${slug}/settings/telegram`,
      pipeline: (orgSlug: string, slug: string) =>
        `/orgs/${orgSlug}/workspaces/${slug}/settings/pipeline`,
    },
  },
  onboarding: {
    root: ROOTS.ONBOARDING,
  },
  invitations: {
    root: ROOTS.INVITATIONS,
    accept: (token: string) => `${ROOTS.INVITE}/${token}`,
  },
  accessDenied: ROOTS.ACCESS_DENIED,
  legal: {
    terms: "/terms",
    privacy: "/privacy",
  },
  organization: {
    workspaces: (slug: string) => `/orgs/${slug}/workspaces`,
    settings: {
      root: (slug: string) => `/orgs/${slug}/settings`,
      members: (slug: string) => `/orgs/${slug}/settings/members`,
      billing: (slug: string) => `/orgs/${slug}/settings/billing`,
      usage: (slug: string) => `/orgs/${slug}/settings/usage`,
    },
  },
} as const;
