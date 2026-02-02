"use client";

import Badge from "@qbs-autonaim/ui/badge";
import Button from "@qbs-autonaim/ui/button";
import TableCell from "@qbs-autonaim/ui/tablecell";
import TableRow from "@qbs-autonaim/ui/tablerow";
import { Check, MessageSquare, X } from "lucide-react";
import Link from "next/link";
import {
  formatDate,
  getHrStatusLabel,
  getStatusLabel,
  getStatusVariant,
} from "./response-helpers";
import type { Response } from "./use-response-filters";

interface ResponseRowProps {
  response: Response;
  orgSlug: string;
  workspaceSlug: string;
  gigId: string;
  onAccept: (responseId: string) => void;
  onReject: (responseId: string) => void;
  onMessage: (responseId: string) => void;
  isProcessing: boolean;
}

export function ResponseRow({
  response,
  orgSlug,
  workspaceSlug,
  gigId,
  onAccept,
  onReject,
  onMessage,
}: ResponseRowProps) {
  return (
    <TableRow>
      <TableCell>
        <Link
          href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}/responses/${response.id}`}
          className="font-medium text-foreground hover:text-primary transition-colors"
        >
          {response.candidateName || "Без имени"}
        </Link>
      </TableCell>
      <TableCell>
        <Badge variant={getStatusVariant(response.status)}>
          {getStatusLabel(response.status)}
        </Badge>
      </TableCell>
      <TableCell>
        {response.score !== null && response.score !== undefined ? (
          <div className="flex items-center gap-1">
            <span className="font-medium">{response.score}</span>
            <span className="text-muted-foreground text-sm">/5</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </TableCell>
      <TableCell>
        {response.hrSelectionStatus ? (
          <Badge variant="outline">
            {getHrStatusLabel(response.hrSelectionStatus)}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatDate(new Date(response.createdAt))}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onMessage(response.id)}
            className="h-8 w-8 p-0 touch-manipulation"
            title="Отправить сообщение"
            aria-label={`Отправить сообщение кандидату ${response.candidateName || "без имени"}`}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onAccept(response.id)}
            className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 touch-manipulation"
            title="Принять"
            aria-label={`Принять кандидата ${response.candidateName || "без имени"}`}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onReject(response.id)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 touch-manipulation"
            title="Отклонить"
            aria-label={`Отклонить кандидата ${response.candidateName || "без имени"}`}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

