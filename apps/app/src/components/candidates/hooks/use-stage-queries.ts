import { useQuery } from "@tanstack/react-query";
import { useORPC } from "~/orpc/react";
import type { FunnelStage } from "../types";

interface UseStageQueriesParams {
  workspaceId: string | null | undefined;
  selectedVacancy: string;
  debouncedSearch: string;
  stageLimits: Record<FunnelStage, number>;
}

export function useStageQueries({
  workspaceId,
  selectedVacancy,
  debouncedSearch,
  stageLimits,
}: UseStageQueriesParams) {
  const orpc = useORPC();
  const enabled = !!workspaceId;

  const screeningDoneQuery = useQuery({
    ...orpc.candidates.list.queryOptions({
      workspaceId: workspaceId ?? "",
      vacancyId: selectedVacancy === "all" ? undefined : selectedVacancy,
      search: debouncedSearch || undefined,
      stages: ["SCREENING_DONE"],
      limit: stageLimits.SCREENING_DONE,
    }),
    enabled,
    placeholderData: (previousData) => previousData,
  });

  const chatInterviewQuery = useQuery({
    ...orpc.candidates.list.queryOptions({
      workspaceId: workspaceId ?? "",
      vacancyId: selectedVacancy === "all" ? undefined : selectedVacancy,
      search: debouncedSearch || undefined,
      stages: ["INTERVIEW"],
      limit: stageLimits.INTERVIEW,
    }),
    enabled,
    placeholderData: (previousData) => previousData,
  });

  const offerSentQuery = useQuery({
    ...orpc.candidates.list.queryOptions({
      workspaceId: workspaceId ?? "",
      vacancyId: selectedVacancy === "all" ? undefined : selectedVacancy,
      search: debouncedSearch || undefined,
      stages: ["OFFER_SENT"],
      limit: stageLimits.OFFER_SENT,
    }),
    enabled,
    placeholderData: (previousData) => previousData,
  });

  const securityPassedQuery = useQuery({
    ...orpc.candidates.list.queryOptions({
      workspaceId: workspaceId ?? "",
      vacancyId: selectedVacancy === "all" ? undefined : selectedVacancy,
      search: debouncedSearch || undefined,
      stages: ["SECURITY_PASSED"],
      limit: stageLimits.SECURITY_PASSED,
    }),
    enabled,
    placeholderData: (previousData) => previousData,
  });

  const contractSentQuery = useQuery({
    ...orpc.candidates.list.queryOptions({
      workspaceId: workspaceId ?? "",
      vacancyId: selectedVacancy === "all" ? undefined : selectedVacancy,
      search: debouncedSearch || undefined,
      stages: ["CONTRACT_SENT"],
      limit: stageLimits.CONTRACT_SENT,
    }),
    enabled,
    placeholderData: (previousData) => previousData,
  });

  const onboardingQuery = useQuery({
    ...orpc.candidates.list.queryOptions({
      workspaceId: workspaceId ?? "",
      vacancyId: selectedVacancy === "all" ? undefined : selectedVacancy,
      search: debouncedSearch || undefined,
      stages: ["ONBOARDING"],
      limit: stageLimits.ONBOARDING,
    }),
    enabled,
    placeholderData: (previousData) => previousData,
  });

  const rejectedQuery = useQuery({
    ...orpc.candidates.list.queryOptions({
      workspaceId: workspaceId ?? "",
      vacancyId: selectedVacancy === "all" ? undefined : selectedVacancy,
      search: debouncedSearch || undefined,
      stages: ["REJECTED"],
      limit: stageLimits.REJECTED,
    }),
    enabled,
    placeholderData: (previousData) => previousData,
  });

  return [
    {
      stage: "SCREENING_DONE" as FunnelStage,
      queryKey: orpc.candidates.list.queryOptions({
        workspaceId: workspaceId ?? "",
        vacancyId: selectedVacancy === "all" ? undefined : selectedVacancy,
        search: debouncedSearch || undefined,
        stages: ["SCREENING_DONE"],
        limit: stageLimits.SCREENING_DONE,
      }).queryKey,
      query: screeningDoneQuery,
    },
    {
      stage: "INTERVIEW" as FunnelStage,
      queryKey: orpc.candidates.list.queryOptions({
        workspaceId: workspaceId ?? "",
        vacancyId: selectedVacancy === "all" ? undefined : selectedVacancy,
        search: debouncedSearch || undefined,
        stages: ["INTERVIEW"],
        limit: stageLimits.INTERVIEW,
      }).queryKey,
      query: chatInterviewQuery,
    },
    {
      stage: "OFFER_SENT" as FunnelStage,
      queryKey: orpc.candidates.list.queryOptions({
        workspaceId: workspaceId ?? "",
        vacancyId: selectedVacancy === "all" ? undefined : selectedVacancy,
        search: debouncedSearch || undefined,
        stages: ["OFFER_SENT"],
        limit: stageLimits.OFFER_SENT,
      }).queryKey,
      query: offerSentQuery,
    },
    {
      stage: "SECURITY_PASSED" as FunnelStage,
      queryKey: orpc.candidates.list.queryOptions({
        workspaceId: workspaceId ?? "",
        vacancyId: selectedVacancy === "all" ? undefined : selectedVacancy,
        search: debouncedSearch || undefined,
        stages: ["SECURITY_PASSED"],
        limit: stageLimits.SECURITY_PASSED,
      }).queryKey,
      query: securityPassedQuery,
    },
    {
      stage: "CONTRACT_SENT" as FunnelStage,
      queryKey: orpc.candidates.list.queryOptions({
        workspaceId: workspaceId ?? "",
        vacancyId: selectedVacancy === "all" ? undefined : selectedVacancy,
        search: debouncedSearch || undefined,
        stages: ["CONTRACT_SENT"],
        limit: stageLimits.CONTRACT_SENT,
      }).queryKey,
      query: contractSentQuery,
    },
    {
      stage: "ONBOARDING" as FunnelStage,
      queryKey: orpc.candidates.list.queryOptions({
        workspaceId: workspaceId ?? "",
        vacancyId: selectedVacancy === "all" ? undefined : selectedVacancy,
        search: debouncedSearch || undefined,
        stages: ["ONBOARDING"],
        limit: stageLimits.ONBOARDING,
      }).queryKey,
      query: onboardingQuery,
    },
    {
      stage: "REJECTED" as FunnelStage,
      queryKey: orpc.candidates.list.queryOptions({
        workspaceId: workspaceId ?? "",
        vacancyId: selectedVacancy === "all" ? undefined : selectedVacancy,
        search: debouncedSearch || undefined,
        stages: ["REJECTED"],
        limit: stageLimits.REJECTED,
      }).queryKey,
      query: rejectedQuery,
    },
  ];
}
