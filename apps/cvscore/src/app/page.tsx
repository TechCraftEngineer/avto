"use client";

import { Button } from "@qbs-autonaim/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import { Clock, Eye, MessageSquare } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { HeroBackground } from "@/components/hero-background";
import { ScreeningCta } from "@/components/screening-cta";
import { ScreeningForm } from "@/components/screening-form";
import { ScreeningResult } from "@/components/screening-result";
import { env } from "@/env";
import {
  type ScreeningOutput,
  screeningOutputSchema,
} from "@/lib/screening-prompt";
import { COPY } from "@/lib/seo";

const BENEFIT_ICON_MAP = {
  clock: Clock,
  eye: Eye,
  message: MessageSquare,
} as const;

const BENEFIT_STYLES = [
  {
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    statBg: "bg-emerald-500/10",
    statColor: "text-emerald-700 dark:text-emerald-300",
  },
  {
    iconBg: "bg-blue-500/15",
    iconColor: "text-blue-600 dark:text-blue-400",
    statBg: "bg-blue-500/10",
    statColor: "text-blue-700 dark:text-blue-300",
  },
  {
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-600 dark:text-amber-400",
    statBg: "bg-amber-500/10",
    statColor: "text-amber-700 dark:text-amber-300",
  },
] as const;

type State = "idle" | "loading" | "success" | "error";

export default function CvScorePage() {
  const [resume, setResume] = useState("");
  const [vacancy, setVacancy] = useState("");
  const [consentToStore, setConsentToStore] = useState(false);
  const [state, setState] = useState<State>("idle");
  const [result, setResult] = useState<ScreeningOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  async function handleSubmit() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setState("loading");
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    try {
      const res = await fetch("/api/screen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume: resume.trim(),
          vacancy: vacancy.trim(),
          consentToStore,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? data.error ?? "Произошла ошибка");
        setState("error");
        return;
      }

      const parsed = screeningOutputSchema.safeParse(data);
      if (!parsed.success) {
        setError("Некорректный ответ сервера. Попробуйте ещё раз.");
        setState("error");
        return;
      }
      setResult(parsed.data);
      setState("success");
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === "AbortError") {
        setError("Превышено время ожидания. Попробуйте ещё раз.");
      } else {
        setError("Ошибка сети. Проверьте подключение и попробуйте снова.");
      }
      setState("error");
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="relative py-12 sm:py-16 md:py-20 lg:py-24 overflow-hidden">
        <HeroBackground />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <span className="inline-flex items-center rounded-full border bg-muted/50 px-3 py-1.5 sm:px-4 text-[11px] sm:text-[13px] font-medium text-muted-foreground tracking-[0.15em] uppercase">
              {COPY.hero.badge}
            </span>
            <h1 className="mb-4 mt-3 sm:mb-6 sm:mt-4 text-2xl leading-tight font-semibold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl text-foreground px-2 sm:px-0">
              {COPY.hero.title}
            </h1>
            <p className="mb-6 sm:mb-8 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto px-2 sm:px-0 leading-relaxed">
              {COPY.hero.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Form + Result */}
      <section className="flex-1 py-8 sm:py-12 md:py-16 relative">
        <div className="absolute inset-0 bg-dub-grid -z-10" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 lg:space-y-10">
            <Card>
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-lg sm:text-xl">
                  {COPY.form.title}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  {COPY.form.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <ScreeningForm
                  resume={resume}
                  vacancy={vacancy}
                  consentToStore={consentToStore}
                  loading={state === "loading"}
                  error={error}
                  onResumeChange={setResume}
                  onVacancyChange={setVacancy}
                  onConsentChange={setConsentToStore}
                  onSubmit={handleSubmit}
                />
              </CardContent>
            </Card>

            {state === "success" && result && (
              <>
                <Card>
                  <CardHeader className="px-4 sm:px-6">
                    <CardTitle className="text-lg sm:text-xl">
                      {COPY.result.title}
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base">
                      {COPY.result.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6">
                    <ScreeningResult result={result} />
                  </CardContent>
                </Card>

                <ScreeningCta
                  signupUrl={`${env.NEXT_PUBLIC_APP_URL}/auth/signup?redirect=/onboarding`}
                />
              </>
            )}
          </div>
        </div>
      </section>

      {/* Benefits — SEO и конверсия */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 border-t bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="sr-only">{COPY.benefits.title}</h2>
          <div className="max-w-5xl mx-auto grid gap-6 sm:gap-8 md:grid-cols-3">
            {COPY.benefits.items.map((item, index) => {
              const IconComponent =
                BENEFIT_ICON_MAP[item.icon as keyof typeof BENEFIT_ICON_MAP] ??
                MessageSquare;
              const style = BENEFIT_STYLES[index] ?? BENEFIT_STYLES[0];
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 sm:p-6 text-center md:text-left shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-md"
                >
                  <div
                    className={`mx-auto mb-4 flex size-12 items-center justify-center rounded-xl ${style.iconBg} md:mx-0`}
                  >
                    <IconComponent
                      className={`size-6 ${style.iconColor} transition-transform duration-300 group-hover:scale-110`}
                    />
                  </div>
                  {item.stat && (
                    <span
                      className={`mb-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${style.statBg} ${style.statColor}`}
                    >
                      {item.stat}
                    </span>
                  )}
                  <h3 className="font-semibold text-foreground mb-2 text-base">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.text}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 sm:py-8 border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-3 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 sm:gap-x-6 sm:gap-y-1">
            <Button
              variant="link"
              asChild
              className="text-muted-foreground h-auto p-0 text-sm"
            >
              <a href={env.NEXT_PUBLIC_APP_URL}>{COPY.footer.back}</a>
            </Button>
            <span className="hidden sm:inline">·</span>
            <a
              href="/privacy"
              className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline text-sm"
            >
              Политика конфиденциальности
            </a>
            <span className="hidden sm:inline">·</span>
            <a
              href="/terms"
              className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline text-sm"
            >
              Условия использования
            </a>
          </div>
          <p className="text-xs text-center">{COPY.footer.poweredBy}</p>
        </div>
      </footer>
    </div>
  );
}
