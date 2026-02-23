import { paths } from "@qbs-autonaim/config";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getSession } from "~/auth/server";
import { api } from "~/orpc/server";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ orgSlug: string; slug: string }>;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect(paths.auth.signin);
  }

  const { orgSlug, slug } = await params;

  // Получаем организацию и проверяем доступ
  const organization = await api.organization.getBySlug({
    slug: orgSlug,
  });

  if (!organization) {
    notFound();
  }

  // Получаем workspace по slug в рамках организации
  const workspace = await api.organization.getWorkspaceBySlug({
    organizationId: organization.id,
    slug,
  });

  if (!workspace) {
    notFound();
  }

  return <>{children}</>;
}
