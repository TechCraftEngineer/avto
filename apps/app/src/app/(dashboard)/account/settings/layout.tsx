"use client";

import { Tabs, TabsList, TabsTrigger } from "@qbs-autonaim/ui";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { PageHeader } from "~/components/layout";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const getCurrentTab = () => {
    if (pathname === "/account/settings/security") return "security";
    return "general";
  };

  const currentTab = getCurrentTab();

  const handleTabChange = (value: string) => {
    if (value === "general") {
      router.push("/account/settings");
    } else {
      router.push(`/account/settings/${value}`);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Настройки аккаунта"
        description="Управляйте настройками вашего аккаунта"
      />

      <Tabs
        value={currentTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid w-full max-w-lg grid-cols-2">
          <TabsTrigger value="general">Основное</TabsTrigger>
          <TabsTrigger value="security">Безопасность</TabsTrigger>
        </TabsList>

        <div className="mt-6">{children}</div>
      </Tabs>
    </div>
  );
}
