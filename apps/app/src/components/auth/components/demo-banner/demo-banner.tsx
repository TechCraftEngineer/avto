"use client";

import { APP_CONFIG } from "@qbs-autonaim/config";
import { Check, Copy, Lock, Sparkles, User } from "lucide-react";
import { useState } from "react";

export function DemoBanner() {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!APP_CONFIG.isDemo) {
    return null;
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const credentials = [
    {
      field: "email",
      label: "Email",
      value: "recruiter@demo.qbs.ru",
      icon: User,
    },
    {
      field: "password",
      label: "Пароль",
      value: "demo123456",
      icon: Lock,
    },
  ];

  return (
    <div className="relative mb-6 overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-yellow-950/30 dark:border-amber-800/50">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-amber-400/20 rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-orange-400/20 rounded-full blur-2xl" />

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 shadow-sm">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-900 dark:text-amber-100">
              Демо-доступ
            </h3>
            <p className="text-xs text-amber-700/70 dark:text-amber-300/70">
              Используйте готовые данные для входа
            </p>
          </div>
        </div>

        {/* Credentials */}
        <div className="space-y-2">
          {credentials.map(({ field, label, value, icon: Icon }) => (
            <div
              key={field}
              className="group flex items-center gap-3 p-3 rounded-lg bg-white/60 dark:bg-black/20 border border-amber-200/60 dark:border-amber-800/30 hover:bg-white/80 dark:hover:bg-black/30 transition-all duration-200"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400">
                <Icon className="h-4 w-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium text-amber-700/60 dark:text-amber-400/60 uppercase tracking-wider">
                  {label}
                </div>
                <div className="font-mono text-sm text-amber-900 dark:text-amber-100 truncate">
                  {value}
                </div>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(value, field)}
                className={`
                  flex items-center justify-center w-8 h-8 rounded-md
                  transition-all duration-200
                  ${
                    copiedField === field
                      ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                      : "bg-amber-100/50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800/50"
                  }
                `}
                aria-label={`Копировать ${label.toLowerCase()}`}
              >
                {copiedField === field ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Hint */}
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-amber-600/70 dark:text-amber-400/60">
          <div className="w-1 h-1 rounded-full bg-amber-400" />
          <span>Нажмите на иконку для копирования</span>
        </div>
      </div>
    </div>
  );
}
