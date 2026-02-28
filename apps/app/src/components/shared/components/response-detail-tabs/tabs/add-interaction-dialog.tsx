"use client";

import { Button } from "@qbs-autonaim/ui/components/button";
import { Calendar } from "@qbs-autonaim/ui/components/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@qbs-autonaim/ui/components/dialog";
import { Label } from "@qbs-autonaim/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@qbs-autonaim/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@qbs-autonaim/ui/components/select";
import { Textarea } from "@qbs-autonaim/ui/components/textarea";
import { cn } from "@qbs-autonaim/ui/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon, Plus } from "lucide-react";
import { useState } from "react";
import { useORPC } from "~/orpc/react";

const INTERACTION_TYPE_OPTIONS = [
  { value: "call", label: "Звонок" },
  { value: "email_sent", label: "Письмо отправлено" },
  { value: "meeting", label: "Встреча" },
  { value: "message_sent", label: "Сообщение отправлено" },
  { value: "note", label: "Заметка" },
  { value: "followup_sent", label: "Напоминание" },
] as const;

const CHANNEL_OPTIONS = [
  { value: "phone", label: "Телефон" },
  { value: "email", label: "Email" },
  { value: "telegram", label: "Telegram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "in_person", label: "Личная встреча" },
  { value: "other", label: "Другое" },
] as const;

const TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

interface AddInteractionDialogProps {
  responseId: string;
  workspaceId: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function AddInteractionDialog({
  responseId,
  workspaceId,
  trigger,
  onSuccess,
}: AddInteractionDialogProps) {
  const orpc = useORPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [interactionType, setInteractionType] = useState<string>("call");
  const [happenedAt, setHappenedAt] = useState<Date>(() => new Date());
  const [timeSlot, setTimeSlot] = useState<string>("14:00");
  const [channel, setChannel] = useState<string>("");
  const [note, setNote] = useState("");

  const { mutate, isPending } = useMutation(
    orpc.vacancy.responses.createInteraction.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.vacancy.responses.listInteractions.queryKey({
            input: { responseId, workspaceId },
          }),
        });
        setOpen(false);
        setInteractionType("call");
        setHappenedAt(new Date());
        setTimeSlot("14:00");
        setChannel("");
        setNote("");
        onSuccess?.();
      },
    }),
  );

  const handleSubmit = () => {
    const [hours = 0, minutes = 0] = timeSlot.split(":").map(Number);
    const happenedAtDate = new Date(happenedAt);
    happenedAtDate.setHours(hours, minutes, 0, 0);

    mutate({
      responseId,
      workspaceId,
      interactionType:
        interactionType as (typeof INTERACTION_TYPE_OPTIONS)[number]["value"],
      happenedAt: happenedAtDate,
      channel: channel || undefined,
      note: note || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Добавить
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Добавить взаимодействие
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Тип</Label>
            <Select value={interactionType} onValueChange={setInteractionType}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Выберите тип" />
              </SelectTrigger>
              <SelectContent>
                {INTERACTION_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Когда</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !happenedAt && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {happenedAt ? (
                      format(happenedAt, "d MMMM yyyy", { locale: ru })
                    ) : (
                      <span>Выберите дату</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={happenedAt}
                    onSelect={(d) => d && setHappenedAt(d)}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Select value={timeSlot} onValueChange={setTimeSlot}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Канал</Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Не указан" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Не указан</SelectItem>
                {CHANNEL_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Заметка</Label>
            <Textarea
              className="mt-1"
              placeholder="Дополнительный контекст…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Сохранение…" : "Добавить"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
