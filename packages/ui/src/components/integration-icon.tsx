import { MessageCircle } from "lucide-react";
import Image from "next/image";
import { AvitoIcon, SuperjobIcon } from "./icons";

interface IntegrationIconProps {
  type: "hh" | "telegram" | "avito" | "superjob";
  className?: string;
}

export function IntegrationIcon({
  type,
  className = "h-5 w-5",
}: IntegrationIconProps) {
  if (type === "hh") {
    return (
      <Image
        src="/headhunter-logo.svg"
        alt="HeadHunter"
        width={20}
        height={20}
        className={className}
      />
    );
  }

  if (type === "telegram") {
    return (
      <Image
        src="/telegram.svg"
        alt="Telegram"
        width={20}
        height={20}
        className={className}
      />
    );
  }

  if (type === "avito") {
    return <AvitoIcon className={className} />;
  }

  if (type === "superjob") {
    return <SuperjobIcon className={className} />;
  }

  return <MessageCircle className={className} />;
}
