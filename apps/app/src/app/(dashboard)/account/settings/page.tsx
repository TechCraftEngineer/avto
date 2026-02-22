"use client";

import { Skeleton } from "@qbs-autonaim/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { GeneralTab } from "~/components";
import { useORPC } from "~/orpc/react";

export default function AccountSettingsPage() {
  const orpc = useORPC();
  const { data: user, isLoading } = useQuery(orpc.user.me.queryOptions());

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  if (!user) {
    return null;
  }

  return <GeneralTab user={user} />;
}
