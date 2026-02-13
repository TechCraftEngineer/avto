"use client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui";
import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Check } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { PageHeader } from "~/components/layout";
import { useTRPC } from "~/trpc/react";

const plans = [
  {
    name: "Бесплатный",
    price: "0",
    period: "навсегда",
    description: "Для начинающих и тестирования",
    features: [
      "До 10 откликов в месяц",
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
    name: "Профессиональный",
    price: "990",
    period: "мес",
    description: "Для активного поиска работы",
    features: [
      "До 500 откликов в месяц",
      "Все шаблоны и персонализация",
      "До 10 активных вакансий",
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
    price: "2490",
    period: "мес",
    description: "Для профессионалов и рекрутеров",
    features: [
      "Неограниченные отклики",
      "Все функции Профессионального",
      "Неограниченные активные вакансии",
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
  const trpc = useTRPC();
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
    trpc.organization.getBySlug.queryOptions({ slug: params.orgSlug }),
  );

  // Получаем историю платежей организации
  const { data: payments, isLoading: isLoadingPayments } = useQuery(
    trpc.payment.list.queryOptions(
      organization?.id
        ? {
            organizationId: organization.id,
            limit: 10,
          }
        : skipToken,
    ),
  );

  // Мутация для обновления плана
  const { mutate: updatePlan, isPending } = useMutation(
    trpc.organization.updatePlan.mutationOptions({
      onSuccess: () => {
        toast.success("Тарифный план успешно обновлён");
        queryClient.invalidateQueries({
          queryKey: trpc.organization.getBySlug.queryKey({
            slug: params.orgSlug,
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
    trpc.organization.createPlanPayment.mutationOptions({
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

  const handleSelectPlan = (planId: "free" | "pro" | "enterprise") => {
    if (!organization) return;

    // Для бесплатного плана просто обновляем
    if (planId === "free") {
      updatePlan({
        organizationId: organization.id,
        plan: planId,
      });
      return;
    }

    // Для платных планов создаём платёж
    const returnUrl = `${window.location.origin}/orgs/${params.orgSlug}/settings/billing?payment=success`;
    createPayment({
      organizationId: organization.id,
      plan: planId,
      returnUrl,
    });
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

  const currentPlan = organization.plan || "free";

  return (
    <div className="flex flex-col gap-8 p-6">
      <PageHeader
        title="Тарифы и биллинг"
        description="Выберите тариф, который подходит для вашей организации. Тариф применяется ко всем рабочим пространствам."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.planId === currentPlan;
          return (
            <Card
              key={plan.name}
              className={
                plan.variant === "default" ? "border-primary shadow-md" : ""
              }
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.badge && (
                    <Badge variant="default" className="ml-2">
                      {plan.badge}
                    </Badge>
                  )}
                  {isCurrent && (
                    <Badge variant="secondary" className="ml-2">
                      Текущий
                    </Badge>
                  )}
                </div>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">₽</span>
                  <span className="text-muted-foreground text-sm">
                    / {plan.period}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col gap-4">
                <ul className="flex flex-col gap-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="text-primary mt-0.5 size-4 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  variant={plan.variant}
                  className="w-full"
                  disabled={isCurrent || isPending || isCreatingPayment}
                  onClick={() => handleSelectPlan(plan.planId)}
                >
                  {isPending || isCreatingPayment
                    ? "Обработка…"
                    : isCurrent
                      ? "Текущий тариф"
                      : "Выбрать тариф"}
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
