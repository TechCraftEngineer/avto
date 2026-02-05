interface ScoreCellProps {
  score: number | null | undefined;
  maxScore?: number;
}

export function ScoreCell({ score, maxScore = 10 }: ScoreCellProps) {
  if (score == null) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-sm font-medium">{score}</span>
      <span className="text-xs text-muted-foreground">/{maxScore}</span>
    </div>
  );
}
