import { Button, Separator } from "@qbs-autonaim/ui";
import { Download, ExternalLink } from "lucide-react";
import Link from "next/link";

interface ResumeActionsProps {
  resumeUrl: string;
  resumePdfUrl?: string | null;
}

export function ResumeActions({ resumeUrl, resumePdfUrl }: ResumeActionsProps) {
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
        {resumePdfUrl && (
          <Link
            href={resumePdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
          >
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Скачать PDF
            </Button>
          </Link>
        )}
      </div>
    </>
  );
}
