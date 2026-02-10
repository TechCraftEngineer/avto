"use client";

import { cn } from "@qbs-autonaim/ui";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useGettingStarted } from "~/hooks/use-getting-started";

interface GettingStartedBadgeProps {
  onClick?: () => void;
  className?: string;
}

export function GettingStartedBadge({
  onClick,
  className,
}: GettingStartedBadgeProps) {
  const { progressPercentage, shouldShowWidget } = useGettingStarted();
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
    <motion.button
      type="button"
      initial={
        prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }
      }
      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
      transition={animationConfig}
      onClick={onClick}
      className={cn(
        "flex h-12 flex-col items-center justify-center rounded-full",
        "border border-neutral-950 bg-neutral-950 px-6",
        "text-xs font-medium leading-tight text-white",
        "shadow-md",
        "transition-all duration-200",
        "hover:bg-neutral-800 hover:ring-4 hover:ring-neutral-200",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-200",
        "active:scale-95",
        "dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-950",
        "dark:hover:bg-neutral-200 dark:hover:ring-neutral-800",
        "dark:focus-visible:ring-neutral-800",
        className,
      )}
      style={{
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
      }}
      aria-haspopup="dialog"
      aria-expanded="false"
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
  );
}
