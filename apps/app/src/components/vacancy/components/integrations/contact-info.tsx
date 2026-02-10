import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@qbs-autonaim/ui";
import { formatPhone } from "@qbs-autonaim/validators";
import { Copy, Mail, Phone, PhoneCall } from "lucide-react";
import { toast } from "sonner";

interface Contact {
  raw?: string;
  city?: string;
  type?: string;
  number?: string;
  comment?: string;
  country?: string;
  verified?: boolean;
  formatted?: string;
  needVerification?: boolean;
  email?: string;
}

interface ContactsData {
  phone?: Contact[];
  email?: Contact[];
  [key: string]: Contact[] | undefined;
}

interface ContactInfoProps {
  contacts: ContactsData | unknown;
  size?: "sm" | "md";
}

export function ContactInfo({ contacts, size = "md" }: ContactInfoProps) {
  if (!contacts || typeof contacts !== "object") {
    return <span className="text-sm text-muted-foreground">Не указаны</span>;
  }

  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  const contactsData = contacts as ContactsData;
  const allContacts: Array<{ contact: Contact; contactType: string }> = [];

  // Функция для копирования в буфер обмена
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Скопировано в буфер обмена");
    } catch (error) {
      console.error("Ошибка копирования:", error);
      toast.error("Не удалось скопировать");
    }
  };

  // Функция для звонка
  const makeCall = (phone: string) => {
    // Убираем все символы кроме цифр и +
    const cleanPhone = phone.replace(/[^\d+]/g, "");
    window.location.href = `tel:${cleanPhone}`;
  };

  // Collect all contacts from different types
  Object.entries(contactsData).forEach(([key, items]) => {
    if (Array.isArray(items)) {
      items.forEach((contact) => {
        allContacts.push({ contact, contactType: key });
      });
    }
  });

  if (allContacts.length === 0) {
    return <span className="text-sm text-muted-foreground">Не указаны</span>;
  }

  const maxLength = size === "sm" ? 30 : 50;
  const maxCommentLength = size === "sm" ? 40 : 60;

  return (
    <div className="flex flex-col gap-1.5">
      {allContacts.map(({ contact, contactType }, index) => {
        const isPhone =
          contactType === "phone" ||
          contact.type === "cell" ||
          contact.type === "phone";

        // Для телефонов всегда пытаемся отформатировать
        let displayValue = contact.formatted || contact.raw;
        if (isPhone) {
          // Используем raw если есть, иначе formatted
          const phoneToFormat = contact.raw || contact.formatted;
          if (phoneToFormat) {
            try {
              displayValue = formatPhone(phoneToFormat);
            } catch (error) {
              // Если не удалось отформатировать, используем исходное значение
              console.warn(
                "Ошибка форматирования телефона:",
                phoneToFormat,
                error,
              );
              displayValue = phoneToFormat;
            }
          }
        }

        // Пропускаем контакты без значения
        if (!displayValue) {
          return null;
        }

        const isTruncated = displayValue.length > maxLength;
        const truncatedValue = isTruncated
          ? `${displayValue.slice(0, maxLength)}…`
          : displayValue;

        const hasComment = contact.comment && contact.comment.length > 0;
        const isCommentTruncated =
          hasComment && (contact.comment?.length ?? 0) > maxCommentLength;
        const truncatedComment = isCommentTruncated
          ? `${contact.comment?.slice(0, maxCommentLength)}…`
          : contact.comment;

        return (
          <div
            key={`${contactType}-${contact.raw || contact.formatted || contact.email}-${index}`}
            className="flex flex-col gap-0.5"
          >
            {isPhone ? (
              // Для телефонов - DropdownMenu с опциями
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={`flex items-center gap-1.5 ${textSize} text-foreground font-medium hover:underline text-left`}
                  >
                    <Phone
                      className={`${iconSize} text-muted-foreground shrink-0`}
                    />
                    <span>{truncatedValue}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem
                    onClick={() => makeCall(displayValue)}
                    className="cursor-pointer"
                  >
                    <PhoneCall className="mr-2 h-4 w-4" />
                    <span>Позвонить</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => copyToClipboard(displayValue)}
                    className="cursor-pointer"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    <span>Скопировать</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              // Для email - HoverCard с возможностью копирования
              <HoverCard>
                <HoverCardTrigger asChild>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(displayValue)}
                    className={`flex items-center gap-1.5 ${textSize} text-foreground font-medium hover:underline text-left`}
                  >
                    <Mail
                      className={`${iconSize} text-muted-foreground shrink-0`}
                    />
                    <span>{truncatedValue}</span>
                  </button>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Email</h4>
                    <p className="text-sm text-muted-foreground break-all">
                      {displayValue}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Нажмите, чтобы скопировать
                    </p>
                  </div>
                </HoverCardContent>
              </HoverCard>
            )}
            {hasComment && (
              <span className={`${textSize} text-muted-foreground ml-5`}>
                {truncatedComment}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
