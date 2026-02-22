"use client";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@qbs-autonaim/ui/components/hover-card";
import { formatPhone } from "@qbs-autonaim/validators";
import { Cake, Check, Copy, Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";

interface CandidateInfoProps {
  age: number | null;
  birthDate: Date | null;
  location: string | null;
  phone: string | null;
  email: string | null;
}

export function CandidateInfo({
  age,
  birthDate,
  location,
  phone,
  email,
}: CandidateInfoProps) {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyPhone = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (phone) {
      await navigator.clipboard.writeText(phone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const handleCopyEmail = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (email) {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const formattedPhone = phone
    ? (() => {
        try {
          return formatPhone(phone);
        } catch {
          return phone;
        }
      })()
    : null;

  return (
    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
      {age !== null && (
        <HoverCard>
          <HoverCardTrigger asChild>
            <div className="flex items-center gap-1 cursor-help">
              <Cake className="h-3 w-3 shrink-0" />
              <span>
                {age} {age === 1 ? "год" : age < 5 ? "года" : "лет"}
              </span>
            </div>
          </HoverCardTrigger>
          <HoverCardContent side="right" className="w-auto">
            <p className="text-xs">
              Дата рождения:{" "}
              {birthDate
                ? new Date(birthDate).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
            </p>
          </HoverCardContent>
        </HoverCard>
      )}

      {location && (
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate max-w-[120px]">{location}</span>
        </div>
      )}

      {phone && (
        <HoverCard>
          <HoverCardTrigger asChild>
            <div className="flex items-center gap-1 cursor-help">
              <Phone className="h-3 w-3 shrink-0" />
            </div>
          </HoverCardTrigger>
          <HoverCardContent side="right" className="w-auto p-3">
            <div className="flex items-center gap-3">
              <a
                href={`tel:${phone}`}
                className="text-sm font-medium hover:underline transition-colors font-mono"
                onClick={(e) => e.stopPropagation()}
              >
                {formattedPhone}
              </a>
              <button
                type="button"
                onClick={handleCopyPhone}
                className={`
                  p-1.5 rounded-md transition-all duration-200
                  ${
                    copiedPhone
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "hover:bg-accent text-muted-foreground hover:text-foreground"
                  }
                `}
                aria-label={copiedPhone ? "Скопировано" : "Скопировать телефон"}
              >
                {copiedPhone ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </HoverCardContent>
        </HoverCard>
      )}

      {email && (
        <HoverCard>
          <HoverCardTrigger asChild>
            <div className="flex items-center gap-1 cursor-help">
              <Mail className="h-3 w-3 shrink-0" />
            </div>
          </HoverCardTrigger>
          <HoverCardContent side="right" className="w-auto p-3">
            <div className="flex items-center gap-3">
              <a
                href={`mailto:${email}`}
                className="text-sm font-medium hover:underline break-all transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {email}
              </a>
              <button
                type="button"
                onClick={handleCopyEmail}
                className={`
                  p-1.5 rounded-md transition-all duration-200 shrink-0
                  ${
                    copiedEmail
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "hover:bg-accent text-muted-foreground hover:text-foreground"
                  }
                `}
                aria-label={copiedEmail ? "Скопировано" : "Скопировать email"}
              >
                {copiedEmail ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </HoverCardContent>
        </HoverCard>
      )}
    </div>
  );
}
