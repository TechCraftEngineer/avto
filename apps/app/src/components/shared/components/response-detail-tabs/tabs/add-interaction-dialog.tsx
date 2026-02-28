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
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@qbs-autonaim/ui/components/toggle-group";
import { cn } from "@qbs-autonaim/ui/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Bell,
  CalendarIcon,
  CircleSlash,
  Clock,
  Mail,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Phone,
  Plus,
  Send,
  StickyNote,
  UserRound,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useORPC } from "~/orpc/react";

const INTERACTION_TYPE_OPTIONS = [
  { value: "call", label: "Звонок", icon: Phone },
  { value: "email_sent", label: "Письмо", icon: Mail },
  { value: "meeting", label: "Встреча", icon: Users },
  { value: "message_sent", label: "Сообщение", icon: MessageSquare },
  { value: "note", label: "Заметка", icon: StickyNote },
  { value: "followup_sent", label: "Напоминание", icon: Bell },
] as const;

const CHANNEL_NONE = "__none__";

const CHANNEL_OPTIONS = [
  { value: CHANNEL_NONE, label: "Не указан", icon: CircleSlash },
  { value: "phone", label: "Телефон", icon: Phone },
  { value: "email", label: "Email", icon: Mail },
  { value: "telegram", label: "Telegram", icon: Send },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { value: "in_person", label: "Лично", icon: UserRound },
  { value: "other", label: "Другое", icon: MoreHorizontal },
] as const;

const HOURS = Array.from({ length: 24 }, (_, i) =>
  i.toString().padStart(2, "0"),
);
const MINUTES = ["00", "30"];

function roundToNearest30(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const rounded = m < 15 ? 0 : m < 45 ? 30 : 0;
  const hour = m >= 45 ? (h + 1) % 24 : h;
  return `${hour.toString().padStart(2, "0")}:${rounded.toString().padStart(2, "0")}`;
}

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
  const [timeValue, setTimeValue] = useState<string>(() =>
    roundToNearest30(format(new Date(), "HH:mm")),
  );
  const [timeOpen, setTimeOpen] = useState(false);
  const [channel, setChannel] = useState<string>(CHANNEL_NONE);
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
        setTimeValue(roundToNearest30(format(new Date(), "HH:mm")));
        setChannel(CHANNEL_NONE);
        setNote("");
        onSuccess?.();
      },
      onError: (error) => {
        const message =
          error instanceof Error
            ? error.message
            : "Не удалось добавить взаимодействие";
        toast.error(message);
      },
    }),
  );

  const handleSubmit = () => {
    const [hours = 0, minutes = 0] = timeValue.split(":").map(Number);
    const happenedAtDate = new Date(happenedAt);
    happenedAtDate.setHours(hours, minutes, 0, 0);

    mutate({
      responseId,
      workspaceId,
      interactionType:
        interactionType as (typeof INTERACTION_TYPE_OPTIONS)[number]["value"],
      happenedAt: happenedAtDate,
      channel:
        channel && channel !== CHANNEL_NONE
          ? (channel as (typeof CHANNEL_OPTIONS)[number]["value"])
          : undefined,
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
            <Label className="mb-2 block">Тип</Label>
            <ToggleGroup
              type="single"
              value={interactionType}
              onValueChange={(v) => v && setInteractionType(v)}
              variant="outline"
              size="sm"
              spacing={1}
              className={cn(
                "flex flex-wrap gap-1.5 rounded-lg border border-input bg-muted/40 p-1.5",
              )}
            >
              {INTERACTION_TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <ToggleGroupItem
                    key={opt.value}
                    value={opt.value}
                    className={cn(
                      "gap-1.5 px-3",
                      "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary/30 data-[state=on]:shadow-sm",
                    )}
                    aria-label={opt.label}
                  >
                    <Icon className="size-4 shrink-0" />
                    {opt.label}
                  </ToggleGroupItem>
                );
              })}
            </ToggleGroup>
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
              <Popover open={timeOpen} onOpenChange={setTimeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[120px] justify-start text-left font-normal",
                      !timeValue && "text-muted-foreground",
                    )}
                  >
                    <Clock className="mr-2 h-4 w-4 shrink-0" />
                    {timeValue || "Время"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="start">
                  <div className="flex items-center gap-2">
                    <Select
                      value={timeValue.split(":")[0]}
                      onValueChange={(h) =>
                        setTimeValue(`${h}:${timeValue.split(":")[1] ?? "00"}`)
                      }
                    >
                      <SelectTrigger className="w-[72px]" aria-label="Часы">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HOURS.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-muted-foreground font-medium">:</span>
                    <Select
                      value={timeValue.split(":")[1] ?? "00"}
                      onValueChange={(m) =>
                        setTimeValue(`${timeValue.split(":")[0] ?? "00"}:${m}`)
                      }
                    >
                      <SelectTrigger className="w-[72px]" aria-label="Минуты">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MINUTES.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Канал</Label>
            <ToggleGroup
              type="single"
              value={channel}
              onValueChange={(v) => v && setChannel(v)}
              variant="outline"
              size="sm"
              spacing={1}
              className={cn(
                "flex flex-wrap gap-1.5 rounded-lg border border-input bg-muted/40 p-1.5",
              )}
            >
              {CHANNEL_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <ToggleGroupItem
                    key={opt.value}
                    value={opt.value}
                    className={cn(
                      "gap-1.5 px-3",
                      "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary/30 data-[state=on]:shadow-sm",
                    )}
                    aria-label={opt.label}
                  >
                    <Icon className="size-4 shrink-0" />
                    {opt.label}
                  </ToggleGroupItem>
                );
              })}
            </ToggleGroup>
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
