"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@qbs-autonaim/ui";
import {
  IconCheck,
  IconChevronDown,
  IconCircleDotted,
  IconDots,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useGettingStarted } from "~/hooks/use-getting-started";

export function GettingStartedContainer() {
  const {
    steps,
    progressPercentage,
    shouldShowWidget,
    dismissWidget,
    isUpdating,
  } = useGettingStarted();

  const [isOpen, setIsOpen] = useState(false);
  const [showDismissMenu, setShowDismissMenu] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  if (!shouldShowWidget || progressPercentage === 100) {
    return null;
  }

  const animationConfig = prefersReducedMotion
    ? { duration: 0.1 }
    : {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
      };

  return (
    <div className="fixed bottom-0 right-0 z-40 m-5">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <motion.button
            type="button"
            initial={
              prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }
            }
            animate={
              prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }
            }
            exit={
              prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }
            }
            transition={animationConfig}
            className="flex h-12 flex-col items-center justify-center rounded-full border border-neutral-950 bg-neutral-950 px-6 text-xs font-medium leading-tight text-white shadow-md transition-all hover:bg-neutral-800 hover:ring-4 hover:ring-neutral-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-200 active:scale-95 dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-950 dark:hover:bg-neutral-200 dark:hover:ring-neutral-800 dark:focus-visible:ring-neutral-800"
            style={{
              touchAction: "manipulation",
              WebkitTapHighlightColor: "transparent",
            }}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            aria-label={`Начало работы: ${progressPercentage}% завершено`}
          >
            <span>Начало работы</span>
            <span
              className="text-neutral-400 dark:text-neutral-600"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {progressPercentage}%&nbsp;завершено
            </span>
          </motion.button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          className="w-[400px] max-w-[calc(100vw-2rem)] rounded-xl p-0 shadow-xl"
          sideOffset={8}
        >
          {/* Header */}
          <div className="rounded-t-xl bg-neutral-950 p-4 text-white dark:bg-neutral-50 dark:text-neutral-950">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-base font-medium">Начало работы</span>
                <p className="mt-1 text-sm text-neutral-300 dark:text-neutral-600">
                  Познакомьтесь с платформой, выполнив следующие задачи
                </p>
              </div>
              <div className="flex items-center gap-1">
                {/* Dismiss Menu */}
                <DropdownMenu
                  open={showDismissMenu}
                  onOpenChange={setShowDismissMenu}
                >
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="rounded-md px-1 py-1 text-neutral-400 transition-colors hover:bg-white/20 active:text-white dark:text-neutral-600 dark:hover:bg-black/10"
                      aria-label="Опции"
                    >
                      <IconDots className="size-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-auto"
                    sideOffset={8}
                  >
                    <DropdownMenuItem
                      onClick={() => {
                        dismissWidget(true);
                        setShowDismissMenu(false);
                        setIsOpen(false);
                      }}
                      disabled={isUpdating}
                      className="cursor-pointer"
                    >
                      Не показывать больше
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-md px-1 py-1 text-neutral-400 transition-colors hover:bg-white/20 active:text-white dark:text-neutral-600 dark:hover:bg-black/10"
                  aria-label="Закрыть"
                >
                  <IconChevronDown className="size-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Tasks */}
          <div className="p-3">
            <div className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800">
              {steps.map((step) => (
                <Link
                  key={step.id}
                  href={step.href}
                  onClick={() => {
                    setIsOpen(false);
                    step.action?.();
                  }}
                  className="group flex items-center justify-between gap-3 p-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900 sm:gap-10"
                >
                  <div className="flex items-center gap-2">
                    {step.completed ? (
                      <IconCheck className="size-5 text-green-500" />
                    ) : (
                      <IconCircleDotted className="size-5 text-neutral-400" />
                    )}
                    <p className="text-sm text-neutral-800 dark:text-neutral-200">
                      {step.title}
                    </p>
                  </div>
                  <div className="mr-5">
                    <svg
                      className="size-4 text-neutral-500 transition-transform group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
