"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import { AlertTriangle, CheckCircle2, HelpCircle } from "lucide-react";
import { motion } from "motion/react";
import type { ScreeningOutput } from "@/lib/screening-prompt";

interface ScreeningResultProps {
  result: ScreeningOutput;
}

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 70
      ? "stroke-primary"
      : score >= 50
        ? "stroke-muted-foreground"
        : "stroke-destructive/70";
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="size-28 -rotate-90" viewBox="0 0 100 100" aria-hidden>
        <title>Оценка кандидата</title>
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/30"
        />
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className={color}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <motion.span
        className="absolute text-2xl font-bold tabular-nums"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      >
        {score}
      </motion.span>
    </div>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function ScreeningResult({ result }: ScreeningResultProps) {
  const { score, strengths, risks, interviewQuestions } = result;

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="show"
      variants={container}
    >
      <motion.div
        className="flex flex-col sm:flex-row items-center gap-8"
        variants={item}
      >
        <ScoreRing score={score} />
        <div>
          <h3 className="text-lg font-medium mb-1">Оценка кандидата</h3>
          <p className="text-muted-foreground text-sm">
            {score >= 70
              ? "Высокое соответствие вакансии"
              : score >= 50
                ? "Среднее соответствие — стоит рассмотреть"
                : "Низкое соответствие — возможны риски"}
          </p>
        </div>
      </motion.div>

      <div className="grid sm:grid-cols-2 gap-4">
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="size-4 text-primary" />
                Сильные стороны
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {strengths.map((s, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="text-primary shrink-0">•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="size-4 text-muted-foreground" />
                Риски
              </CardTitle>
            </CardHeader>
            <CardContent>
              {risks.length > 0 ? (
                <ul className="space-y-2">
                  {risks.map((r, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="text-muted-foreground shrink-0">•</span>
                      {r}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Существенных рисков не выявлено
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HelpCircle className="size-4 text-primary" />
              Вопросы для интервью
            </CardTitle>
            <CardDescription>
              Рекомендуемые вопросы для проверки кандидата
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 list-decimal list-inside text-sm">
              {interviewQuestions.map((q, i) => (
                <li key={i} className="pl-1">
                  {q}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
