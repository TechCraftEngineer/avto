import type { ReactNode } from "react";
import { SettingsSidebar } from "~/components";
import { PageHeader } from "~/components/layout";
import { env } from "~/env";

export default async function SettingsLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ orgSlug: string; slug: string }>;
}) {
  await params;

  return (
    <div className="bg-muted/40 flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-7xl space-y-4 p-4 pb-8 sm:space-y-6 sm:p-6 lg:p-10 lg:pb-16">
        <div className="space-y-2">
          <PageHeader
            title="Настройки"
            description="Управляйте настройками рабочего пространства и интеграциями"
            tooltipContent={`Настройте параметры рабочего пространства: домены, интеграции с HH, Avito и другими платформами, уведомления и доступы.\n\n[Подробнее в документации](${env.NEXT_PUBLIC_DOCS_URL}/organizations/workspaces)`}
          />
          <p className="text-sm text-muted-foreground">
            Настройте параметры рабочего пространства, управляйте доменами и
            интеграциями с внешними платформами.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-start">
          <aside className="w-full shrink-0 lg:w-[240px]">
            <div className="rounded-lg border bg-white p-2">
              <SettingsSidebar />
            </div>
          </aside>
          <main className="min-w-0 flex-1">
            <div className="space-y-6 rounded-lg border bg-white p-4 sm:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
