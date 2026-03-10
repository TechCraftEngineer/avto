"use client";

import { Badge } from "@qbs-autonaim/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  HelpCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useState } from "react";
import type { ScreeningOutput } from "@/lib/screening-prompt";

interface ScreeningResultProps {
  result: ScreeningOutput;
}

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 70
      ? "stroke-emerald-600 dark:stroke-emerald-500"
      : score >= 50
        ? "stroke-amber-500 dark:stroke-amber-400"
        : "stroke-destructive/80";
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="size-32 -rotate-90" viewBox="0 0 100 100" aria-hidden>
        <title>Оценка кандидата: {score}/100</title>
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-muted/20"
        />
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          className={color}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <motion.span
        className="absolute text-3xl font-bold tabular-nums tracking-tight"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.35 }}
      >
        {score}
      </motion.span>
    </div>
  );
}

function getScoreVariant(score: number): {
  label: string;
  description: string;
  badgeVariant:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning";
} {
  if (score >= 70)
    return {
      label: "Высокое соответствие",
      description: "Кандидат хорошо подходит под требования вакансии",
      badgeVariant: "success",
    };
  if (score >= 50)
    return {
      label: "Среднее соответствие",
      description: "Стоит рассмотреть — возможны нюансы для уточнения",
      badgeVariant: "warning",
    };
  return {
    label: "Низкое соответствие",
    description: "Имеются значительные расхождения с требованиями",
    badgeVariant: "destructive",
  };
}

function CopyQuestionButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="shrink-0 rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      title={copied ? "Скопировано" : "Скопировать вопрос"}
      aria-label={copied ? "Скопировано" : "Скопировать вопрос"}
    >
      {copied ? (
        <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </button>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function ScreeningResult({ result }: ScreeningResultProps) {
  const { score, strengths, risks, interviewQuestions } = result;
  const scoreInfo = getScoreVariant(score);

  return (
    <motion.div
      className="space-y-8"
      initial="hidden"
      animate="show"
      variants={container}
    >
      {/* Оценка — главный блок */}
      <motion.div
        className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-10 p-6 rounded-xl bg-muted/40 border border-border/60"
        variants={item}
      >
        <ScoreRing score={score} />
        <div className="flex-1 text-center sm:text-left min-w-0">
          <Badge variant={scoreInfo.badgeVariant} className="mb-3">
            {scoreInfo.label}
          </Badge>
          <p className="text-muted-foreground text-[15px] leading-relaxed">
            {scoreInfo.description}
          </p>
        </div>
      </motion.div>

      {/* Сильные стороны и риски */}
      <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
        <motion.div variants={item}>
          <Card className="border-border/80 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <span className="flex size-8 items-center justify-center rounded-full bg-emerald-500/15">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                </span>
                Сильные стороны
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                {strengths.map((s) => (
                  <li key={s} className="flex gap-2.5 text-sm leading-snug">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500/60" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="border-border/80 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <span className="flex size-8 items-center justify-center rounded-full bg-amber-500/15">
                  <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
                </span>
                Риски
              </CardTitle>
            </CardHeader>
            <CardContent>
              {risks.length > 0 ? (
                <ul className="space-y-2.5">
                  {risks.map((r) => (
                    <li key={r} className="flex gap-2.5 text-sm leading-snug">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500/60" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground py-1">
                  Существенных рисков не выявлено
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Вопросы для интервью */}
      <motion.div variants={item}>
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                <HelpCircle className="size-4 text-primary" />
              </span>
              Вопросы для интервью
            </CardTitle>
            <CardDescription>
              Кликните на иконку, чтобы скопировать вопрос
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {interviewQuestions.map((q, i) => (
                <li
                  key={q}
                  className="group flex items-start gap-2 rounded-lg p-3 -mx-1 hover:bg-muted/50 transition-colors"
                >
                  <span className="shrink-0 flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-medium">
                    {i + 1}
                  </span>
                  <span className="flex-1 min-w-0 text-sm leading-relaxed pt-0.5">
                    {q}
                  </span>
                  <CopyQuestionButton text={q} />
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
