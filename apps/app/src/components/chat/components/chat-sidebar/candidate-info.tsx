import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import { Label } from "@qbs-autonaim/ui/components/label";

interface CandidateInfoProps {
  candidateName: string | null;
  chatId: string;
}

export function CandidateInfo({ candidateName, chatId }: CandidateInfoProps) {
  return (
    <Card size="sm">
      <CardHeader className="p-0 pb-3">
        <CardTitle className="text-base">О кандидате</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-0">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Имя</Label>
          <p className="text-sm font-medium">{candidateName ?? "Не указано"}</p>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Telegram</Label>
          <p className="text-sm font-medium">@{chatId}</p>
        </div>
      </CardContent>
    </Card>
  );
}
