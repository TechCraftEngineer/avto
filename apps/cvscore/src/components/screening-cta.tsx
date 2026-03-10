"use client";

import { Button } from "@qbs-autonaim/ui/components/button";
import {
  ArrowRight,
  BarChart3,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { COPY } from "@/lib/seo";

interface ScreeningCtaProps {
  signupUrl: string;
}

const FEATURES = [
  { icon: Zap, label: "AI-интервью в Telegram" },
  { icon: Users, label: "Импорт откликов с hh.ru" },
  { icon: TrendingUp, label: "Шортлист и аналитика" },
  { icon: BarChart3, label: "Автоматизация рутины" },
] as const;

export function ScreeningCta({ signupUrl }: ScreeningCtaProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="group relative isolate overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-muted/30 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] transition-all duration-500 hover:shadow-[0_20px_60px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_20px_60px_rgb(0,0,0,0.5)]"
    >
      {/* Ambient glow effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-12 -top-12 size-48 rounded-full bg-primary/5 blur-3xl transition-all duration-700 group-hover:bg-primary/10" />
        <div className="absolute -bottom-12 -left-12 size-48 rounded-full bg-accent/5 blur-3xl transition-all duration-700 group-hover:bg-accent/10" />
      </div>

      {/* Subtle grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px),
                           linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative px-6 py-8 sm:px-8 sm:py-10">
        {/* Icon badge */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/10 transition-all duration-300 group-hover:scale-105 group-hover:ring-primary/20"
        >
          <Sparkles className="size-7 text-primary transition-transform duration-300 group-hover:rotate-12" />
        </motion.div>

        {/* Headline */}
        <h3 className="mb-3 text-center font-semibold text-foreground text-xl sm:text-2xl tracking-tight">
          {COPY.cta.headline}
        </h3>

        {/* Description */}
        <p className="mx-auto mb-6 max-w-2xl text-center text-muted-foreground text-sm leading-relaxed sm:text-base">
          {COPY.cta.text}
        </p>

        {/* Feature grid */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
                className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-background/50 p-3 text-center backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:bg-background/80"
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/5">
                  <Icon className="size-4 text-primary" />
                </div>
                <span className="text-foreground/80 text-xs font-medium leading-tight">
                  {feature.label}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
          className="flex justify-center"
        >
          <Button
            size="lg"
            asChild
            className="group/btn relative overflow-hidden bg-primary text-primary-foreground shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] transition-all duration-300 hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:scale-[1.02] active:scale-[0.98]"
          >
            <a
              href={signupUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${COPY.cta.button} (открывается в новой вкладке)`}
            >
              <span className="relative z-10 flex items-center gap-2">
                {COPY.cta.button}
                <ArrowRight className="size-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
              </span>
              {/* Button shine effect */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" />
            </a>
          </Button>
        </motion.div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
    </motion.div>
  );
}
