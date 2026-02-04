"use client";

import { Badge } from "@qbs-autonaim/ui/badge";
import { Button } from "@qbs-autonaim/ui/button";
import {
  Calendar,
  Download,
  GitCompare,
  Mail,
  MoreHorizontal,
  Phone,
  Star,
} from "lucide-react";
import { useState } from "react";
import type { VacancyResponse } from "./types";

interface QuickActionsFabProps {
  response: VacancyResponse;
}

export function QuickActionsFab({ response }: QuickActionsFabProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const actions = [
    {
      id: "favorite",
      icon: Star,
      label: "Избранное",
      color: "text-yellow-600 hover:bg-yellow-50",
      action: () => alert("Добавлено в избранное"),
    },
    {
      id: "call",
      icon: Phone,
      label: "Позвонить",
      color: "text-green-600 hover:bg-green-50",
      action: () => {
        if (response.phone) {
          window.location.href = `tel:${response.phone}`;
        } else {
          alert("Номер телефона не указан");
        }
      },
    },
    {
      id: "email",
      icon: Mail,
      label: "Написать",
      color: "text-blue-600 hover:bg-blue-50",
      action: () => {
        if (response.email) {
          window.location.href = `mailto:${response.email}`;
        } else {
          alert("Email не указан");
        }
      },
    },
    {
      id: "schedule",
      icon: Calendar,
      label: "Запланировать",
      color: "text-purple-600 hover:bg-purple-50",
      action: () => alert("Открыть планировщик интервью"),
    },
    {
      id: "export",
      icon: Download,
      label: "Экспорт",
      color: "text-orange-600 hover:bg-orange-50",
      action: () => alert("Открыть экспорт данных"),
    },
    {
      id: "compare",
      icon: GitCompare,
      label: "Сравнить",
      color: "text-indigo-600 hover:bg-indigo-50",
      action: () => alert("Открыть сравнение кандидатов"),
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Основная кнопка FAB */}
      <div className="relative">
        {/* Расширенные действия */}
        {isExpanded && (
          <div className="absolute bottom-16 right-0 flex flex-col gap-2 mb-2">
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <div
                  key={action.id}
                  className={`animate-in slide-in-from-right-full fade-in duration-200`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className={`h-12 px-4 gap-3 shadow-lg bg-white border-2 ${action.color} transition-all hover:scale-105`}
                    onClick={() => {
                      action.action();
                      setIsExpanded(false);
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{action.label}</span>
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Основная плавающая кнопка */}
        <Button
          size="lg"
          className={`h-14 w-14 rounded-full shadow-xl transition-all duration-300 ${
            isExpanded ? "rotate-45 scale-110" : "hover:scale-110"
          }`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <MoreHorizontal className="h-6 w-6" />
        </Button>
      </div>

      {/* Индикатор статуса кандидата */}
      <div className="absolute -top-2 -right-2">
        <Badge
          variant="secondary"
          className={`px-2 py-1 text-xs font-medium ${
            response.status === "NEW"
              ? "bg-blue-100 text-blue-800"
              : response.status === "EVALUATED"
                ? "bg-yellow-100 text-yellow-800"
                : response.status === "INTERVIEW"
                  ? "bg-purple-100 text-purple-800"
                  : response.status === "NEGOTIATION"
                    ? "bg-orange-100 text-orange-800"
                    : response.status === "COMPLETED"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
          }`}
        >
          {response.status}
        </Badge>
      </div>
    </div>
  );
}
