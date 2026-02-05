import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@qbs-autonaim/ui";

interface CoverLetterCellProps {
  coverLetter: string | null;
}

export function CoverLetterCell({ coverLetter }: CoverLetterCellProps) {
  if (!coverLetter) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  return (
    <div className="max-w-50 truncate">
      <HoverCard>
        <HoverCardTrigger asChild>
          <span className="text-sm text-muted-foreground cursor-help">
            {coverLetter.length > 50
              ? `${coverLetter.substring(0, 50)}...`
              : coverLetter}
          </span>
        </HoverCardTrigger>
        <HoverCardContent
          side="left"
          className="max-w-sm max-h-64 overflow-y-auto"
        >
          <p className="text-sm whitespace-pre-wrap">{coverLetter}</p>
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}
