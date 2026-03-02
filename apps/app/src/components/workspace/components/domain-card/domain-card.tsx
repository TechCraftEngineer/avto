"use client";

import type { CustomDomain } from "@qbs-autonaim/db/schema";
import { Badge } from "@qbs-autonaim/ui/components/badge";
import { Button } from "@qbs-autonaim/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@qbs-autonaim/ui/components/dropdown-menu";
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
import { useDomainOperations } from "../../hooks";
import { DeleteDomainDialog } from "../delete-domain-dialog";
import { DnsInstructionsDialog } from "../dns-instructions-dialog";

interface DomainCardProps {
  domain: CustomDomain;
  workspaceId: string;
}

export function DomainCard({ domain, workspaceId }: DomainCardProps) {
  const [showDnsDialog, setShowDnsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { verify, setPrimary, isVerifying, isSettingPrimary } =
    useDomainOperations({
      workspaceId,
    });

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <Globe className="h-5 w-5 shrink-0 text-muted-foreground" />
              <CardTitle className="min-w-0 truncate font-mono text-base">
                {domain.domain}
              </CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-2">
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
                      onClick={() => setPrimary({ domainId: domain.id })}
                      disabled={isSettingPrimary}
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

              <div className="flex flex-col gap-2 sm:flex-row">
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
                  onClick={() => verify({ domainId: domain.id })}
                  disabled={isVerifying}
                  className="flex-1"
                >
                  {isVerifying && (
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
