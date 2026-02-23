"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@qbs-autonaim/ui/components/alert-dialog";
import { Badge } from "@qbs-autonaim/ui/components/badge";
import { Button } from "@qbs-autonaim/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import { cn } from "@qbs-autonaim/ui/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Minus } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "~/components/layout";
import { useORPC } from "~/orpc/react";

type PlanId = "free" | "starter" | "pro" | "enterprise";

/** Порядок планов для определения upgrade/downgrade (меньше = дешевле) */
const PLAN_ORDER: Record<PlanId, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  enterprise: 3,
};

const PLAN_NAMES: Record<PlanId, string> = {
  free: "Бесплатный",
  starter: "Стартовый",
  pro: "Профессиональный",
  enterprise: "Корпоративный",
};

const MAX_FEATURES = 6;

const plans = [
  {
    name: "Бесплатный",
    price: "0",
    period: "навсегда",
    description: "Для тестирования продукта",
    features: [
      "До 25 откликов в месяц",
      "Базовые шаблоны сопроводительных писем",
      "1 активная вакансия",
      "Поддержка по email",
    ],
    limitations: ["Без приоритетной поддержки", "Без аналитики"],
    badge: null,
    variant: "outline" as const,
    planId: "free" as const,
  },
  {
    name: "Стартовый",
    price: "490",
    period: "мес",
    description: "Для микробизнеса и фрилансеров",
    features: [
      "До 150 откликов в месяц",
      "До 3 активных вакансий",
      "AI-скрининг резюме",
      "Базовые шаблоны",
    ],
    limitations: [],
    badge: null,
    variant: "outline" as const,
    planId: "starter" as const,
  },
  {
    name: "Профессиональный",
    price: "1 490",
    period: "мес",
    description: "Для SMB и IT-компаний",
    features: [
      "До 1 000 откликов в месяц",
      "До 10 активных вакансий",
      "Все шаблоны и персонализация",
      "Аналитика откликов",
      "Приоритетная поддержка",
      "Автоматические отклики",
    ],
    limitations: [],
    badge: "Популярный",
    variant: "default" as const,
    planId: "pro" as const,
  },
  {
    name: "Корпоративный",
    price: "4 990",
    period: "мес",
    description: "Для агентств и крупных компаний",
    features: [
      "Неограниченные отклики",
      "Неограниченные вакансии",
      "Расширенная аналитика и отчёты",
      "API доступ",
      "Персональный менеджер",
      "Кастомные интеграции",
    ],
    limitations: [],
    badge: null,
    variant: "outline" as const,
    planId: "enterprise" as const,
  },
];

export default function OrganizationBillingPage() {
  const params = useParams<{ orgSlug: string }>();
  const searchParams = useSearchParams();
  const orpc = useORPC();
  const queryClient = useQueryClient();

  // Обработка успешного платежа
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus === "success") {
      toast.success("Платёж успешно обработан");
      // Очищаем параметр из URL
      window.history.replaceState(
        {},
        "",
        `/orgs/${params.orgSlug}/settings/billing`,
      );
    }
  }, [searchParams, params.orgSlug]);

  // Получаем данные организации
  const { data: organization, isLoading } = useQuery(
    orpc.organization.getBySlug.queryOptions({
      input: { slug: params.orgSlug },
    }),
  );

  // Получаем историю платежей организации
  const { data: payments, isLoading: isLoadingPayments } = useQuery({
    ...orpc.payment.list.queryOptions({
      input: {
        organizationId: organization?.id ?? "",
        limit: 10,
      },
    }),
    enabled: !!organization?.id,
  });

  // Мутация для обновления плана
  const { mutate: updatePlan, isPending } = useMutation(
    orpc.organization.updatePlan.mutationOptions({
      onSuccess: () => {
        toast.success("Тарифный план успешно обновлён");
        queryClient.invalidateQueries({
          queryKey: orpc.organization.getBySlug.queryKey({
            input: { slug: params.orgSlug },
          }),
        });
      },
      onError: (error) => {
        toast.error(error.message || "Не удалось обновить тарифный план");
      },
    }),
  );

  // Мутация для создания платежа
  const { mutate: createPayment, isPending: isCreatingPayment } = useMutation(
    orpc.organization.createPlanPayment.mutationOptions({
      onSuccess: (data) => {
        if (data.confirmationUrl) {
          window.location.href = data.confirmationUrl;
        } else {
          toast.error("Не удалось получить ссылку на оплату");
        }
      },
      onError: (error) => {
        toast.error(error.message || "Не удалось создать платёж");
      },
    }),
  );

  const [pendingDowngrade, setPendingDowngrade] = useState<PlanId | null>(null);

  const isDowngrade = (targetPlan: PlanId) => {
    if (!organization) return false;
    const current = (organization.plan || "free") as PlanId;
    return PLAN_ORDER[targetPlan] < PLAN_ORDER[current];
  };

  const handleSelectPlan = (planId: PlanId) => {
    if (!organization) return;

    const current = (organization.plan || "free") as PlanId;
    const downgrade = PLAN_ORDER[planId] < PLAN_ORDER[current];

    // Downgrade: обновляем план без оплаты
    if (downgrade) {
      // Для downgrade показываем подтверждение
      setPendingDowngrade(planId);
      return;
    }

    // Upgrade: для платных планов создаём платёж (planId не free, т.к. free — минимальный план)
    const returnUrl = `${window.location.origin}/orgs/${params.orgSlug}/settings/billing?payment=success`;
    createPayment({
      organizationId: organization.id,
      plan: planId,
      returnUrl,
    });
  };

  const confirmDowngrade = () => {
    if (!organization || !pendingDowngrade) return;
    updatePlan(
      {
        organizationId: organization.id,
        plan: pendingDowngrade,
      },
      {
        onSettled: () => setPendingDowngrade(null),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 p-6">
        <PageHeader title="Тарифы и биллинг" description="Загрузка…" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex flex-col gap-8 p-6">
        <PageHeader
          title="Тарифы и биллинг"
          description="Организация не найдена"
        />
      </div>
    );
  }

  const currentPlan = (organization.plan || "free") as PlanId;

  const getPlanButtonText = (plan: (typeof plans)[0]) => {
    if (isPending || isCreatingPayment) return "Обработка…";
    if (plan.planId === currentPlan) return "Текущий тариф";
    if (isDowngrade(plan.planId)) {
      return plan.planId === "free"
        ? "Вернуться на бесплатный"
        : "Понизить тариф";
    }
    return "Выбрать тариф";
  };

  return (
    <div className="flex flex-col gap-8 p-6">
      <AlertDialog
        open={pendingDowngrade !== null}
        onOpenChange={(open) => !open && setPendingDowngrade(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingDowngrade && pendingDowngrade !== "free"
                ? `Понизить тариф до «${PLAN_NAMES[pendingDowngrade]}»?`
                : "Вернуться на бесплатный тариф?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDowngrade === "free" ? (
                <>
                  Вы потеряете доступ к платным функциям: больше откликов,
                  расширенные шаблоны, AI-скрининг и другие возможности. Тариф
                  изменится сразу.
                </>
              ) : pendingDowngrade ? (
                <>
                  Тариф изменится на «{PLAN_NAMES[pendingDowngrade]}».
                  Ограничения нового плана начнут действовать сразу.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDowngrade();
              }}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Обработка…" : "Подтвердить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <PageHeader
        title="Тарифы и биллинг"
        description="Выберите тариф, который подходит для вашей организации. Тариф применяется ко всем рабочим пространствам."
      />

      <div className="grid auto-rows-fr gap-5 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const isCurrent = plan.planId === currentPlan;
          const isPopular = plan.badge === "Популярный";
          const allItems: (string | null)[] = [
            ...plan.features,
            ...(plan.limitations?.map((l) => `limitation:${l}`) ?? []),
            ...Array(
              MAX_FEATURES -
                plan.features.length -
                (plan.limitations?.length ?? 0),
            ).fill(null),
          ];
          return (
            <Card
              key={plan.name}
              className={cn(
                "relative flex h-full flex-col overflow-hidden transition-all duration-200",
                isPopular &&
                  "border-primary/40 bg-linear-to-b from-primary/3 to-transparent shadow-lg ring-1 ring-primary/15 dark:from-primary/5 dark:ring-primary/20",
                !isPopular &&
                  "hover:border-border/80 hover:shadow-md hover:shadow-black/5",
              )}
            >
              {/* Лента «Популярный» */}
              {isPopular && (
                <div
                  aria-hidden
                  className="absolute right-0 top-0 h-8 w-28 origin-top-right translate-x-3 translate-y-1 -rotate-45 bg-primary px-2 text-center text-[10px] font-semibold tracking-wide text-primary-foreground shadow-sm"
                >
                  {plan.badge}
                </div>
              )}

              <CardHeader className="pb-4 pt-6">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-lg tracking-tight">
                    {plan.name}
                  </CardTitle>
                  {isCurrent && (
                    <Badge
                      variant="secondary"
                      className="font-medium text-muted-foreground"
                    >
                      Текущий
                    </Badge>
                  )}
                </div>
                <CardDescription className="mt-1.5 text-[13px] leading-snug">
                  {plan.description}
                </CardDescription>
                <div className="mt-5 flex items-baseline gap-0.5">
                  <span className="tabular-nums text-3xl font-semibold tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground ml-0.5 text-sm">
                    ₽
                  </span>
                  <span className="text-muted-foreground ml-1 text-sm">
                    / {plan.period}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="min-h-44 flex-1 border-t border-border/60 py-4">
                <ul className="flex flex-col gap-2.5">
                  {allItems.map((item, i) =>
                    item === null ? (
                      <li
                        key={`${plan.planId}-spacer-${i}`}
                        className="h-6"
                        aria-hidden
                      />
                    ) : item.startsWith("limitation:") ? (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-sm text-muted-foreground/90"
                      >
                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center">
                          <Minus className="size-3 opacity-50" />
                        </span>
                        <span className="leading-snug line-through">
                          {item.replace("limitation:", "")}
                        </span>
                      </li>
                    ) : (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-sm"
                      >
                        <span className="bg-primary/10 text-primary mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
                          <Check className="size-2.5" strokeWidth={2.5} />
                        </span>
                        <span className="leading-snug">{item}</span>
                      </li>
                    ),
                  )}
                </ul>
              </CardContent>

              <CardFooter className="shrink-0 border-t border-border/60 pt-4">
                <Button
                  variant={isPopular ? "default" : "outline"}
                  size="lg"
                  className="h-10 w-full font-medium"
                  disabled={isCurrent || isPending || isCreatingPayment}
                  onClick={() => handleSelectPlan(plan.planId)}
                >
                  {getPlanButtonText(plan)}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>История платежей</CardTitle>
          <CardDescription>
            Ваши последние транзакции и счета организации
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPayments ? (
            <div className="text-muted-foreground flex items-center justify-center py-8 text-sm">
              Загрузка…
            </div>
          ) : !payments || payments.length === 0 ? (
            <div className="text-muted-foreground flex items-center justify-center py-8 text-sm">
              У вас пока нет платежей
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => {
                const statusLabels: Record<string, string> = {
                  pending: "Ожидает оплаты",
                  waiting_for_capture: "Ожидает подтверждения",
                  succeeded: "Успешно",
                  canceled: "Отменён",
                };

                const statusVariants: Record<
                  string,
                  "default" | "secondary" | "destructive" | "outline"
                > = {
                  pending: "secondary",
                  waiting_for_capture: "secondary",
                  succeeded: "default",
                  canceled: "destructive",
                };

                const variant = statusVariants[payment.status] || "outline";
                const label = statusLabels[payment.status] || "Неизвестно";
                if (!statusLabels[payment.status]) {
                  console.warn(
                    "[billing] Неизвестный статус платежа для диагностики:",
                    payment.status,
                    { paymentId: payment.id },
                  );
                }

                return (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {payment.description || "Платёж"}
                        </span>
                        <Badge variant={variant}>{label}</Badge>
                      </div>
                      <span className="text-muted-foreground text-sm">
                        {new Date(payment.createdAt).toLocaleDateString(
                          "ru-RU",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {Number(payment.amount).toLocaleString("ru-RU")} ₽
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
