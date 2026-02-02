"use client";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@qbs-autonaim/ui";
import { ResponseRow } from "./response-row";
import type { Response } from "./use-response-filters";

interface ResponsesTableProps {
  responses: Response[];
  orgSlug: string;
  workspaceSlug: string;
  gigId: string;
  onAccept: (responseId: string) => void;
  onReject: (responseId: string) => void;
  onMessage: (responseId: string) => void;
  isProcessing: boolean;
}

export function ResponsesTable({
  responses,
  orgSlug,
  workspaceSlug,
  gigId,
  onAccept,
  onReject,
  onMessage,
  isProcessing,
}: ResponsesTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="min-w-[200px]">Кандидат</TableHead>
            <TableHead className="min-w-[120px]">Статус</TableHead>
            <TableHead className="min-w-[100px]">Оценка</TableHead>
            <TableHead className="min-w-[140px]">HR статус</TableHead>
            <TableHead className="min-w-[120px]">Дата</TableHead>
            <TableHead className="w-[180px] text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {responses.map((response) => (
            <ResponseRow
              key={response.id}
              response={response}
              orgSlug={orgSlug}
              workspaceSlug={workspaceSlug}
              gigId={gigId}
              onAccept={onAccept}
              onReject={onReject}
              onMessage={onMessage}
              isProcessing={isProcessing}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
