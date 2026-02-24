import { Button } from "@qbs-autonaim/ui/components/button";
import {
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  FileText,
  Globe,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import type { VacancyResponse } from "./types";

interface CandidateKeyInfoProps {
  response: VacancyResponse;
  resumePdfUrl?: string | null;
}

const SALARY_COMMENT_PREVIEW_LENGTH = 100;

function KeyInfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0 not-last:border-b not-last:border-border/50">
      <Icon className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-muted-foreground mb-1">
          {label}
        </div>
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}

export function CandidateKeyInfo({
  response,
  resumePdfUrl,
}: CandidateKeyInfoProps) {
  const [isSalaryCommentExpanded, setIsSalaryCommentExpanded] = useState(false);

  const hasResume = response.resumeId || resumePdfUrl;
  const hasProfile = response.profileUrl;
  const hasSalary = Boolean(response.salaryExpectationsAmount);
  const hasAny = hasResume || hasProfile || hasSalary;

  if (!hasAny) return null;

  return (
    <div className="p-4 bg-muted/30 rounded-lg border">
      <h3 className="text-sm font-medium mb-1">Ключевая информация</h3>
      <div className="space-y-0">
        {hasResume && (
          <KeyInfoRow icon={FileText} label="Резюме">
            <div className="flex flex-wrap items-center gap-2">
              {resumePdfUrl ? (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-7 text-xs"
                >
                  <a
                    href={resumePdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Скачать PDF
                  </a>
                </Button>
              ) : (
                <span className="text-muted-foreground text-xs">
                  Доступно в профиле
                </span>
              )}
            </div>
          </KeyInfoRow>
        )}

        {hasProfile && (
          <KeyInfoRow icon={Globe} label="Профиль на платформе">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground truncate max-w-[200px] md:max-w-[300px]">
                {response.profileUrl}
              </span>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-7 text-xs shrink-0"
              >
                <a
                  href={response.profileUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Перейти
                </a>
              </Button>
            </div>
          </KeyInfoRow>
        )}

        {hasSalary && (
          <KeyInfoRow icon={Wallet} label="Зарплатные ожидания">
            <div>
              <div className="font-semibold font-mono tabular-nums">
                {response.salaryExpectationsAmount?.toLocaleString()}&nbsp;₽
              </div>
              {response.salaryExpectationsComment && (
                <div className="text-xs text-muted-foreground mt-1">
                  {response.salaryExpectationsComment.length >
                  SALARY_COMMENT_PREVIEW_LENGTH ? (
                    isSalaryCommentExpanded ? (
                      <>
                        {response.salaryExpectationsComment}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsSalaryCommentExpanded(false)}
                          className="h-6 px-2 py-0 mt-2 text-xs"
                        >
                          <ChevronUp className="h-3 w-3 mr-1" />
                          Свернуть
                        </Button>
                      </>
                    ) : (
                      <>
                        {response.salaryExpectationsComment.slice(
                          0,
                          SALARY_COMMENT_PREVIEW_LENGTH,
                        )}
                        …
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsSalaryCommentExpanded(true)}
                          className="h-6 px-2 py-0 mt-2 text-xs"
                        >
                          <ChevronDown className="h-3 w-3 mr-1" />
                          Ещё
                        </Button>
                      </>
                    )
                  ) : (
                    response.salaryExpectationsComment
                  )}
                </div>
              )}
            </div>
          </KeyInfoRow>
        )}
      </div>
    </div>
  );
}
