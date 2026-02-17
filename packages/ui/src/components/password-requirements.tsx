"use client";

import { CheckCircleIcon } from "lucide-react";

import { cn } from ".";

export interface PasswordRequirement {
  label: string;
  met: boolean;
}

export interface PasswordRequirementsProps {
  requirements: PasswordRequirement[];
  className?: string;
}

/**
 * Компонент для отображения требований к паролю с анимацией
 * Показывает список требований с иконками и анимацией при выполнении
 */
export function PasswordRequirements({
  requirements,
  className,
}: PasswordRequirementsProps) {
  return (
    <ul className={cn("mt-2 flex flex-wrap items-center gap-3", className)}>
      {requirements.map((requirement, index) => (
        <li
          key={index}
          className={cn(
            "flex items-center gap-1 text-xs transition-colors",
            requirement.met ? "text-green-600" : "text-neutral-400"
          )}
        >
          <CheckCircleIcon
            className={cn(
              "size-2.5 transition-opacity",
              requirement.met
                ? "text-green-600 animate-scale-in [--from-scale:1] [--to-scale:1.2] [animation-direction:alternate] [animation-duration:150ms] [animation-iteration-count:2] [animation-timing-function:ease-in-out]"
                : "text-neutral-200"
            )}
          />
          <span>{requirement.label}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Хук для проверки требований к паролю
 */
export function usePasswordRequirements(password: string): PasswordRequirement[] {
  return [
    {
      label: "Цифра",
      met: /\d/.test(password),
    },
    {
      label: "Заглавная буква",
      met: /[A-Z]/.test(password),
    },
    {
      label: "Строчная буква",
      met: /[a-z]/.test(password),
    },
    {
      label: "8 символов",
      met: password.length >= 8,
    },
  ];
}

/**
 * Проверяет, все ли требования к паролю выполнены
 */
export function isPasswordValid(requirements: PasswordRequirement[]): boolean {
  return requirements.every((r) => r.met);
}
