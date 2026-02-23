import { paths } from "@qbs-autonaim/config";
import { redirect } from "next/navigation";
import { getSession } from "~/auth/server";
import { api } from "~/orpc/server";
import { InvitationsClient } from "./invitations-client";

export default async function InvitationsPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect(paths.auth.signin);
  }

  const invites = await api.workspace.invites.pending();

  // Если нет приглашений, редиректим на главную
  if (invites.length === 0) {
    redirect(paths.dashboard.root);
  }

  return <InvitationsClient invites={invites} />;
}
