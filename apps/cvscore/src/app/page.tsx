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

type State = "idle" | "loading" | "success" | "error";

export default function CvScorePage() {
  const [resume, setResume] = useState("");
  const [vacancy, setVacancy] = useState("");
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
      <section className="relative py-16 md:py-24 overflow-hidden">
        <HeroBackground />
        <div className="relative container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <span className="inline-flex items-center rounded-full border bg-muted/50 px-4 py-1.5 text-[13px] font-medium text-muted-foreground tracking-[0.15em] uppercase">
              {COPY.hero.badge}
            </span>
            <h1 className="mb-6 mt-4 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl lg:text-5xl text-foreground">
              {COPY.hero.title}
            </h1>
            <p className="mb-8 text-lg text-muted-foreground max-w-xl mx-auto">
              {COPY.hero.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Form + Result */}
      <section className="flex-1 py-12 md:py-16 bg-dub-grid">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-10">
            <Card>
              <CardHeader>
                <CardTitle>{COPY.form.title}</CardTitle>
                <CardDescription>{COPY.form.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ScreeningForm
                  resume={resume}
                  vacancy={vacancy}
                  loading={state === "loading"}
                  error={error}
                  onResumeChange={setResume}
                  onVacancyChange={setVacancy}
                  onSubmit={handleSubmit}
                />
              </CardContent>
            </Card>

            {state === "success" && result && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>{COPY.result.title}</CardTitle>
                    <CardDescription>{COPY.result.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
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
      <section className="py-12 md:py-16 border-t bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="sr-only">{COPY.benefits.title}</h2>
          <div className="max-w-3xl mx-auto grid sm:grid-cols-3 gap-6">
            {COPY.benefits.items.map((item) => {
              const IconComponent =
                BENEFIT_ICON_MAP[item.icon as keyof typeof BENEFIT_ICON_MAP] ??
                MessageSquare;
              return (
                <div
                  key={item.title}
                  className="rounded-xl border bg-card p-5 text-center sm:text-left transition-shadow hover:shadow-sm"
                >
                  <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-lg bg-muted sm:mx-0">
                    <IconComponent className="size-5 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-foreground mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <Button variant="link" asChild className="text-muted-foreground">
            <a href={env.NEXT_PUBLIC_APP_URL}>{COPY.footer.back}</a>
          </Button>
        </div>
      </footer>
    </div>
  );
}
