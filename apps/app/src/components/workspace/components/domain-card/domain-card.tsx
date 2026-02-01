"use client";

import type { CustomDomain } from "@qbs-autonaim/db/schema";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@qbs-autonaim/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Globe,
  Loader2,
  MoreVertical,
  Star,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";
import { DeleteDomainDialog } from "./delete-domain-dialog";
import { DnsInstructionsDialog } from "./dns-instructions-dialog";

interface DomainCardProps {
  domain: CustomDomain;
  workspaceId: string;
}

export function DomainCard({ domain, workspaceId }: DomainCardProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [showDnsDialog, setShowDnsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const verifyMutation = useMutation(
    trpc.customDomain.verify.mutationOptions({
      onSuccess: () => {
        toast.success("Домен верифицирован", {
          description: "Теперь вы можете использовать этот домен",
        });
        queryClient.invalidateQueries({
          queryKey: trpc.customDomain.list.queryKey({
            workspaceId,
          }),
        });
      },
      onError: (error) => {
        toast.error("Ошибка верификации", {
          description: error.message,
        });
      },
    }),
  );

  const setPrimaryMutation = useMutation(
    trpc.customDomain.setPrimary.mutationOptions({
      onSuccess: () => {
        toast.success("Основной домен изменён");
        queryClient.invalidateQueries({
          queryKey: trpc.customDomain.list.queryKey({
            workspaceId,
          }),
        });
      },
      onError: (error) => {
        toast.error("Ошибка", {
          description: error.message,
        });
      },
    }),
  );

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="font-mono text-base">
                {domain.domain}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {domain.isPrimary && (
                <Badge variant="default" className="gap-1">
                  <Star className="h-3 w-3" />
                  Основной
                </Badge>
              )}
              {domain.isVerified ? (
                <Badge
                  variant="default"
                  className="gap-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Верифицирован
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Не верифицирован
                </Badge>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Открыть меню</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {domain.isVerified && !domain.isPrimary && (
                    <DropdownMenuItem
                      onClick={() =>
                        setPrimaryMutation.mutate({ domainId: domain.id })
                      }
                      disabled={setPrimaryMutation.isPending}
                    >
                      <Star className="mr-2 h-4 w-4" />
                      Сделать основным
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Удалить
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!domain.isVerified && (
            <div className="space-y-3">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  Домен {domain.domain} ожидает верификации. Настройте DNS
                  записи для подтверждения владения доменом.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDnsDialog(true)}
                  className="flex-1"
                >
                  Инструкции по настройке DNS
                </Button>
                <Button
                  size="sm"
                  onClick={() => verifyMutation.mutate({ domainId: domain.id })}
                  disabled={verifyMutation.isPending}
                  className="flex-1"
                >
                  {verifyMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Проверить верификацию
                </Button>
              </div>
            </div>
          )}

          {domain.isVerified && domain.verifiedAt && (
            <p className="text-xs text-muted-foreground">
              Верифицирован{" "}
              {new Date(domain.verifiedAt).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </CardContent>
      </Card>

      <DnsInstructionsDialog
        domain={domain.domain}
        open={showDnsDialog}
        onOpenChange={setShowDnsDialog}
      />

      <DeleteDomainDialog
        domain={domain}
        workspaceId={workspaceId}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </>
  );
}
