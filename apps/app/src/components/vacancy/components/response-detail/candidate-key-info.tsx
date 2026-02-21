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

export function CandidateKeyInfo({
  response,
  resumePdfUrl,
}: CandidateKeyInfoProps) {
  const [isSalaryCommentExpanded, setIsSalaryCommentExpanded] = useState(false);

  const hasResume = response.resumeId || resumePdfUrl;
  const hasProfile = response.profileUrl;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {hasResume && (
        <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors">
          <div className="p-2 bg-background rounded-md border">
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium mb-3">Резюме кандидата</div>
            <div className="flex flex-wrap gap-2">
              {resumePdfUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-8 text-xs"
                >
                  <a
                    href={resumePdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    PDF
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {hasProfile && (
        <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors">
          <div className="p-2 bg-background rounded-md border">
            <Globe className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium mb-1">Профиль на платформе</div>
            <div className="text-xs text-muted-foreground mb-3 truncate">
              {response.profileUrl}
            </div>
            <Button variant="outline" size="sm" asChild className="h-8 text-xs">
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
        </div>
      )}

      {response.salaryExpectationsAmount && (
        <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors">
          <div className="p-2 bg-background rounded-md border">
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium mb-1">Зарплатные ожидания</div>
            <div className="text-xl font-semibold mb-2 font-mono tabular-nums">
              {response.salaryExpectationsAmount.toLocaleString()}&nbsp;₽
            </div>
            {response.salaryExpectationsComment && (
              <div className="text-xs text-muted-foreground">
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
        </div>
      )}
    </div>
  );
}
