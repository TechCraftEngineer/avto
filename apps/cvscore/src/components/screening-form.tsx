"use client";

import { Button } from "@qbs-autonaim/ui/components/button";
import { Checkbox } from "@qbs-autonaim/ui/components/checkbox";
import { Label } from "@qbs-autonaim/ui/components/label";
import { Textarea } from "@qbs-autonaim/ui/components/textarea";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import {
  RESUME_MAX_CHARS,
  RESUME_MIN_CHARS,
  VACANCY_MAX_CHARS,
  VACANCY_MIN_CHARS,
} from "@/lib/screening-prompt";
import { COPY } from "@/lib/seo";

interface ScreeningFormProps {
  resume: string;
  vacancy: string;
  consentToStore: boolean;
  loading: boolean;
  error: string | null;
  onResumeChange: (value: string) => void;
  onVacancyChange: (value: string) => void;
  onConsentChange: (value: boolean) => void;
  onSubmit: () => void;
}

export function ScreeningForm({
  resume,
  vacancy,
  consentToStore,
  loading,
  error,
  onResumeChange,
  onVacancyChange,
  onConsentChange,
  onSubmit,
}: ScreeningFormProps) {
  const resumeOk = resume.length >= RESUME_MIN_CHARS;
  const vacancyOk = vacancy.length >= VACANCY_MIN_CHARS;
  const canSubmit = !loading && resumeOk && vacancyOk;

  const resumeNeed = Math.max(0, RESUME_MIN_CHARS - resume.length);
  const vacancyNeed = Math.max(0, VACANCY_MIN_CHARS - vacancy.length);
  const [consentBefore, consentAfter] = COPY.form.consentLabel.split(
    COPY.form.consentLinkText,
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="resume">
          {COPY.form.resumeLabel}
          <span className="text-muted-foreground font-normal ml-1">
            ({COPY.form.resumeHint})
          </span>
        </Label>
        <Textarea
          id="resume"
          placeholder={COPY.form.resumePlaceholder}
          value={resume}
          onChange={(e) => onResumeChange(e.target.value)}
          disabled={loading}
          rows={8}
          className="font-mono text-sm resize-y"
          maxLength={RESUME_MAX_CHARS}
          aria-invalid={!resumeOk && resume.length > 0}
        />
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">
            {resume.length} / {RESUME_MAX_CHARS} символов
          </span>
          {resume.length > 0 && (
            <span
              className={
                resumeOk
                  ? "text-green-600 dark:text-green-500 flex items-center gap-1"
                  : "text-amber-600 dark:text-amber-500 flex items-center gap-1"
              }
            >
              {resumeOk ? (
                <>
                  <Check className="size-3.5" />
                  минимум {RESUME_MIN_CHARS} выполнено
                </>
              ) : (
                <>
                  <X className="size-3.5" />
                  {COPY.form.validation.resumeAddMore(resumeNeed)}
                </>
              )}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="vacancy">
          {COPY.form.vacancyLabel}
          <span className="text-muted-foreground font-normal ml-1">
            ({COPY.form.vacancyHint})
          </span>
        </Label>
        <Textarea
          id="vacancy"
          placeholder={COPY.form.vacancyPlaceholder}
          value={vacancy}
          onChange={(e) => onVacancyChange(e.target.value)}
          disabled={loading}
          rows={6}
          className="font-mono text-sm resize-y"
          maxLength={VACANCY_MAX_CHARS}
          aria-invalid={!vacancyOk && vacancy.length > 0}
        />
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">
            {vacancy.length} / {VACANCY_MAX_CHARS} символов
          </span>
          {vacancy.length > 0 && (
            <span
              className={
                vacancyOk
                  ? "text-green-600 dark:text-green-500 flex items-center gap-1"
                  : "text-amber-600 dark:text-amber-500 flex items-center gap-1"
              }
            >
              {vacancyOk ? (
                <>
                  <Check className="size-3.5" />
                  минимум {VACANCY_MIN_CHARS} выполнено
                </>
              ) : (
                <>
                  <X className="size-3.5" />
                  {COPY.form.validation.vacancyAddMore(vacancyNeed)}
                </>
              )}
            </span>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border/80 bg-muted/40 p-4">
        <Label
          htmlFor="consent"
          className="flex cursor-pointer items-start gap-3 text-sm font-normal leading-relaxed"
          id="consent-desc"
        >
          <Checkbox
            id="consent"
            checked={consentToStore}
            onCheckedChange={(checked) => onConsentChange(checked === true)}
            disabled={loading}
            aria-describedby="consent-desc consent-hint"
            className="mt-0.5 shrink-0"
          />
          <span className="min-w-0 flex-1">
            {consentBefore}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline underline-offset-2 hover:no-underline"
              onClick={(e) => e.stopPropagation()}
            >
              {COPY.form.consentLinkText}
            </a>
            {consentAfter}
            <span
              id="consent-hint"
              className="mt-2 block text-xs text-muted-foreground"
            >
              {COPY.form.consentHint}
            </span>
          </span>
        </Label>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {!loading &&
          !canSubmit &&
          (resume.length > 0 || vacancy.length > 0) && (
            <div
              className="text-sm text-muted-foreground"
              role="status"
              aria-live="polite"
            >
              {!resumeOk && !vacancyOk
                ? COPY.form.validation.resumeAddMore(resumeNeed) +
                  ". " +
                  COPY.form.validation.vacancyAddMore(vacancyNeed)
                : !resumeOk
                  ? COPY.form.validation.resumeAddMore(resumeNeed)
                  : COPY.form.validation.vacancyAddMore(vacancyNeed)}
            </div>
          )}
        {!loading && canSubmit && (
          // biome-ignore lint/a11y/useSemanticElements: output requires form; role=status for screen readers
          <div
            className="text-sm text-green-600 dark:text-green-500 flex items-center gap-2"
            role="status"
          >
            <Check className="size-4" />
            {COPY.form.validation.ready}
          </div>
        )}
        <Button
          size="lg"
          className="w-full sm:w-auto min-w-[200px]"
          onClick={onSubmit}
          disabled={!canSubmit}
          aria-busy={loading}
          aria-disabled={!canSubmit}
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {COPY.form.buttonLoading}
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              {COPY.form.button}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
