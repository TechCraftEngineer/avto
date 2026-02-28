"use client";

import { Button } from "@qbs-autonaim/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@qbs-autonaim/ui/components/popover";
import { ProgressCircle } from "@qbs-autonaim/ui/components/progress-circle";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

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
            initial={prefersReducedMotion ? {} : { scale: 0.9 }}
            animate={prefersReducedMotion ? {} : { scale: 1 }}
            exit={prefersReducedMotion ? {} : { scale: 0.9 }}
            transition={animationConfig}
            className="animate-slide-up-fade flex h-8 items-center justify-center gap-1.5 rounded-full border border-black bg-black px-3 text-xs font-medium leading-tight text-white shadow-md transition-all [--offset:10px] hover:bg-neutral-800 hover:ring-4 hover:ring-neutral-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-200 active:scale-[0.98] dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-950 dark:hover:bg-neutral-200 dark:hover:ring-neutral-800 dark:focus-visible:ring-neutral-800"
            style={{
              touchAction: "manipulation",
              WebkitTapHighlightColor: "transparent",
            }}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            aria-label={`Начало работы: ${progressPercentage}% завершено`}
          >
            <span>Начало работы</span>
            <ProgressCircle
              progress={progressPercentage / 100}
              className="size-3 text-white/80 [--track-color:#fff3]"
              strokeWidth={3}
            />
          </motion.button>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          className="w-[400px] max-w-[calc(100vw-2rem)] rounded-xl p-0 shadow-xl"
          sideOffset={8}
        >
          {/* Header */}
          <div className="rounded-t-xl bg-black p-4 text-white dark:bg-neutral-50 dark:text-neutral-950">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-base font-medium">Начало работы</span>
                <p className="mt-1 text-sm text-neutral-300 dark:text-neutral-600">
                  Познакомьтесь с платформой, выполнив следующие задачи
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md px-1 py-1 text-neutral-400 transition-colors hover:bg-white/20 active:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black dark:text-neutral-600 dark:hover:bg-black/10 dark:focus-visible:ring-offset-neutral-50"
                aria-label="Закрыть"
              >
                <ChevronDown className="size-4" />
              </button>
            </div>
          </div>

          {/* Tasks */}
          <div className="p-3">
            <div className="grid divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-950">
              {steps.map((step) => (
                <Link
                  key={step.id}
                  href={step.href}
                  onClick={() => {
                    step.action?.();
                    if (timeoutRef.current) clearTimeout(timeoutRef.current);
                    timeoutRef.current = setTimeout(() => {
                      if (isMountedRef.current) setIsOpen(false);
                      timeoutRef.current = null;
                    }, 500);
                  }}
                  className="group flex items-center justify-between gap-3 p-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900 sm:gap-10"
                >
                  <div className="flex items-center gap-2">
                    {step.completed ? (
                      <CheckCircle2 className="size-5 shrink-0 text-green-500" />
                    ) : (
                      <CircleDashed className="size-5 shrink-0 text-neutral-400" />
                    )}
                    <p className="text-sm text-neutral-800 dark:text-neutral-200">
                      {step.title}
                    </p>
                  </div>
                  <div className="mr-5 shrink-0">
                    <ArrowUpRight className="size-4 text-neutral-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </Link>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={() => {
                dismissWidget(true);
                setIsOpen(false);
              }}
              disabled={isUpdating}
              className="mt-3 h-7 rounded-lg bg-black/4 duration-75 hover:bg-black/7 active:scale-[0.98] dark:bg-white/6 dark:hover:bg-white/10"
            >
              Скрыть подсказки
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
