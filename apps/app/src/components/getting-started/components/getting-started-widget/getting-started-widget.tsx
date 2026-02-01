"use client";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  Progress,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@qbs-autonaim/ui";
import {
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconDots,
} from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useGettingStarted } from "~/hooks/use-getting-started";

export function GettingStartedWidget() {
  const {
    steps,
    completedSteps,
    totalSteps,
    progressPercentage,
    shouldShowWidget,
    dismissWidget,
    markOnboardingCompleted,
    isUpdating,
  } = useGettingStarted();

  const [isExpanded, setIsExpanded] = useState(true);
  const [showDismissOptions, setShowDismissOptions] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Проверяем prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Обработка клавиатуры для доступности
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showDismissOptions) {
        setShowDismissOptions(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showDismissOptions]);

  if (!shouldShowWidget) {
    return null;
  }

  // Настройки анимации с учетом prefers-reduced-motion
  const animationConfig = prefersReducedMotion
    ? { duration: 0.1 }
    : {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
        duration: 0.4,
      };

  return (
    <TooltipProvider>
      <motion.div
        initial={
          prefersReducedMotion
            ? { opacity: 0 }
            : { opacity: 0, y: 100, scale: 0.9 }
        }
        animate={
          prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }
        }
        exit={
          prefersReducedMotion
            ? { opacity: 0 }
            : { opacity: 0, y: 100, scale: 0.9 }
        }
        transition={animationConfig}
        className="fixed bottom-4 right-4 z-40 w-96 max-w-[calc(100vw-2rem)]"
        style={{
          bottom: "max(1rem, env(safe-area-inset-bottom))",
          right: "max(1rem, env(safe-area-inset-right))",
          touchAction: "manipulation",
        }}
        role="dialog"
        aria-labelledby="getting-started-title"
        aria-describedby="getting-started-description"
      >
        <Card className="shadow-lg border-border/50 bg-background/95 backdrop-blur-sm">
          {/* Header */}
          <CardHeader className="bg-foreground text-background rounded-t-lg pb-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle
                  id="getting-started-title"
                  className="text-lg font-semibold"
                >
                  Начало работы
                </CardTitle>
                <CardDescription
                  id="getting-started-description"
                  className="text-background/80 text-sm"
                >
                  Завершите настройку для полного функционала
                </CardDescription>
              </div>

              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-11 w-11 p-0 text-background hover:bg-background/20 focus-visible:ring-2 focus-visible:ring-background/50"
                      onClick={() => setShowDismissOptions(!showDismissOptions)}
                      aria-label="Открыть опции скрытия виджета"
                      aria-expanded={showDismissOptions}
                      aria-haspopup="true"
                    >
                      <IconDots className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Опции</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-11 w-11 p-0 text-background hover:bg-background/20 focus-visible:ring-2 focus-visible:ring-background/50"
                      onClick={() => setIsExpanded(!isExpanded)}
                      aria-label={
                        isExpanded ? "Свернуть виджет" : "Развернуть виджет"
                      }
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? (
                        <IconChevronDown
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                      ) : (
                        <IconChevronUp className="h-4 w-4" aria-hidden="true" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isExpanded ? "Свернуть" : "Развернуть"}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Dismiss Options */}
            <AnimatePresence>
              {showDismissOptions && (
                <motion.div
                  initial={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, height: 0 }
                  }
                  animate={
                    prefersReducedMotion
                      ? { opacity: 1 }
                      : { opacity: 1, height: "auto" }
                  }
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, height: 0 }
                  }
                  transition={
                    prefersReducedMotion ? { duration: 0.1 } : { duration: 0.2 }
                  }
                  className="mt-3 pt-3 border-t border-background/20"
                  role="group"
                  aria-label="Опции скрытия виджета"
                >
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 h-11 text-xs bg-background/20 hover:bg-background/30 text-background border-background/30 focus-visible:ring-2 focus-visible:ring-background/50"
                      onClick={() => dismissWidget(false)}
                      disabled={isUpdating}
                    >
                      Скрыть сейчас
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 h-11 text-xs bg-background/20 hover:bg-background/30 text-background border-background/30 focus-visible:ring-2 focus-visible:ring-background/50"
                      onClick={() => dismissWidget(true)}
                      disabled={isUpdating}
                    >
                      Не показывать больше
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardHeader>

          {/* Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, height: 0 }
                }
                animate={
                  prefersReducedMotion
                    ? { opacity: 1 }
                    : { opacity: 1, height: "auto" }
                }
                exit={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, height: 0 }
                }
                transition={
                  prefersReducedMotion ? { duration: 0.1 } : { duration: 0.2 }
                }
              >
                <CardContent className="p-4 space-y-4">
                  {/* Steps */}
                  <ol className="space-y-3" aria-label="Шаги настройки">
                    {steps.map((step, index) => (
                      <li
                        key={step.id}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                          step.completed
                            ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800/30"
                            : "bg-muted/50 border-border/50 hover:bg-muted/80",
                        )}
                      >
                        <div
                          className={cn(
                            "shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mt-0.5",
                            step.completed
                              ? "bg-green-500 text-white"
                              : "bg-muted-foreground/20 text-muted-foreground border-2 border-muted-foreground/30",
                          )}
                        >
                          {step.completed ? (
                            <IconCheck className="w-3 h-3" aria-hidden="true" />
                          ) : (
                            <span aria-hidden="true">{index + 1}</span>
                          )}
                          <span className="sr-only">
                            {step.completed ? "Завершено" : `Шаг ${index + 1}`}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm leading-tight">
                            {step.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {step.description}
                          </p>
                        </div>

                        {!step.completed && step.action && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-11 px-3 text-xs focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={step.action}
                          >
                            Настроить
                          </Button>
                        )}
                      </li>
                    ))}
                  </ol>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Прогресс</span>
                      <span
                        className="font-medium"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {completedSteps}&nbsp;из&nbsp;{totalSteps}
                      </span>
                    </div>
                    <Progress
                      value={progressPercentage}
                      className="h-2"
                      aria-label={`Прогресс настройки: ${progressPercentage}%`}
                    />
                  </div>

                  {/* Complete Button */}
                  {progressPercentage === 100 && (
                    <>
                      <Button
                        onClick={markOnboardingCompleted}
                        disabled={isUpdating}
                        className="w-full h-11 focus-visible:ring-2 focus-visible:ring-ring"
                        aria-describedby="complete-button-description"
                      >
                        {isUpdating ? "Завершение…" : "Завершить настройку"}
                      </Button>
                      <div id="complete-button-description" className="sr-only">
                        Нажмите чтобы отметить настройку как завершенную и
                        скрыть этот виджет
                      </div>
                    </>
                  )}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapsed Footer */}
          {!isExpanded && (
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-semibold"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {progressPercentage}%
                    <span className="sr-only">
                      Прогресс: {progressPercentage} процентов
                    </span>
                  </div>
                  <span className="text-sm font-medium">Начало работы</span>
                </div>
                <span
                  className="text-xs text-muted-foreground"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {completedSteps}/{totalSteps}&nbsp;завершено
                </span>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </TooltipProvider>
  );
}
