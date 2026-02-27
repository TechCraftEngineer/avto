import { Button } from "@qbs-autonaim/ui/components/button";
import { Separator } from "@qbs-autonaim/ui/components/separator";
import { Download, ExternalLink } from "lucide-react";
import Link from "next/link";

interface ResumeActionsProps {
  resumeUrl: string;
  resumePdfUrl?: string | null;
  /** responseId для скачивания PDF с именем ФИО.pdf */
  responseId?: string | null;
}

export function ResumeActions({
  resumeUrl,
  resumePdfUrl,
  responseId,
}: ResumeActionsProps) {
  return (
    <>
      <Separator />
      <div className="flex flex-wrap gap-2">
        <Link href={resumeUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm">
            <ExternalLink className="mr-2 h-4 w-4" />
            Открыть резюме
          </Button>
        </Link>
        {resumePdfUrl && responseId && (
          <>
            <Link
              href={`/api/resume/${responseId}/download?open=1`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                Открыть PDF
              </Button>
            </Link>
            <Link href={`/api/resume/${responseId}/download`}>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Скачать PDF
              </Button>
            </Link>
          </>
        )}
        {resumePdfUrl && !responseId && (
          <Link href={resumePdfUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              Открыть PDF
            </Button>
          </Link>
        )}
      </div>
    </>
  );
}
