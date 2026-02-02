import SidebarInset from "@qbs-autonaim/ui/sidebarinset";
import type { ReactNode } from "react";
import { getSession } from "~/auth/server";
import { OrganizationSettingsAppSidebar } from "~/components/organization";

export default async function OrganizationSettingsLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  const session = await getSession();

  if (!session?.user) {
    return null;
  }

  return (
    <>
      <OrganizationSettingsAppSidebar
        orgSlug={orgSlug}
        user={{
          name: session.user.name,
          email: session.user.email,
          avatar: session.user.image || "",
        }}
      />
      <SidebarInset>
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </>
  );
}

