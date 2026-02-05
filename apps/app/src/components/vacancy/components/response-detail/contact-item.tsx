import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@qbs-autonaim/ui";
import { formatPhone } from "@qbs-autonaim/validators";
import { Copy, Mail, Phone, PhoneCall } from "lucide-react";
import { toast } from "sonner";

interface ContactItemProps {
  type: "phone" | "email";
  value: string;
}

export function ContactItem({ type, value }: ContactItemProps) {
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Скопировано в буфер обмена");
    } catch (error) {
      console.error("Ошибка копирования:", error);
      toast.error("Не удалось скопировать");
    }
  };

  const makeCall = (phone: string) => {
    const cleanPhone = phone.replace(/[^\d+]/g, "");
    window.location.href = `tel:${cleanPhone}`;
  };

  const sendEmail = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  if (type === "phone") {
    let displayValue = value;
    try {
      displayValue = formatPhone(value);
    } catch (error) {
      console.warn("Ошибка форматирования телефона:", value, error);
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm text-foreground hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
          >
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium">{displayValue}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onClick={() => makeCall(value)}
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
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 text-sm text-foreground hover:text-primary transition-colors min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
        >
          <Mail className="h-3.5 w-3.5 shrink-0" />
          <span className="font-medium truncate max-w-[250px]">{value}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          onClick={() => sendEmail(value)}
          className="cursor-pointer"
        >
          <Mail className="mr-2 h-4 w-4" />
          <span>Написать письмо</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => copyToClipboard(value)}
          className="cursor-pointer"
        >
          <Copy className="mr-2 h-4 w-4" />
          <span>Скопировать</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
