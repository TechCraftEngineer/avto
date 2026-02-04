import { Button, Textarea } from "@qbs-autonaim/ui";
import { MessageSquare } from "lucide-react";
import { useState } from "react";

interface HrNotesProps {
  responseId: string;
}

export function HrNotes({ responseId }: HrNotesProps) {
  const [hrNote, setHrNote] = useState(() => {
    const saved = localStorage.getItem(`hr-note-${responseId}`);
    return saved || "";
  });
  const [isNoteEditing, setIsNoteEditing] = useState(false);

  const handleNoteSave = () => {
    localStorage.setItem(`hr-note-${responseId}`, hrNote);
    setIsNoteEditing(false);
  };

  const handleNoteCancel = () => {
    const saved = localStorage.getItem(`hr-note-${responseId}`) || "";
    setHrNote(saved);
    setIsNoteEditing(false);
  };

  return (
    <div className="mt-4 pt-4 border-t">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Заметки HR
        </h4>
        {!isNoteEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsNoteEditing(true)}
            className="h-7 text-xs"
          >
            {hrNote ? "Редактировать" : "Добавить"}
          </Button>
        )}
      </div>

      {isNoteEditing ? (
        <div className="space-y-2">
          <Textarea
            placeholder="Добавьте внутренние заметки по кандидату…"
            value={hrNote}
            onChange={(e) => setHrNote(e.target.value)}
            className="min-h-[80px] text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleNoteSave} className="h-7 text-xs">
              Сохранить
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNoteCancel}
              className="h-7 text-xs"
            >
              Отмена
            </Button>
          </div>
        </div>
      ) : hrNote ? (
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {hrNote}
          </p>
        </div>
      ) : (
        <div className="p-4 border border-dashed border-muted-foreground/25 rounded-lg text-center text-muted-foreground">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs">Нет заметок</p>
        </div>
      )}
    </div>
  );
}
