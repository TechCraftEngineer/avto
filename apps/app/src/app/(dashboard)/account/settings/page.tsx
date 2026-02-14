"use client";

import { Skeleton } from "@qbs-autonaim/ui";
import { useQuery } from "@tanstack/react-query";
import { GeneralTab } from "~/components";
import { useTRPC } from "~/trpc/react";

export default function AccountSettingsPage() {
  const trpc = useTRPC();
  const { data: user, isLoading } = useQuery(trpc.user.me.queryOptions());

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  if (!user) {
    return null;
  }

  return <GeneralTab user={user} />;
}
