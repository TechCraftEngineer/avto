interface ScoreCellProps {
  score: number | null | undefined;
  maxScore?: number;
}

export function ScoreCell({ score, maxScore }: ScoreCellProps) {
  if (score == null) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  // Округляем до целого числа для чистого отображения
  const displayScore = Math.round(score);

  return (
    <span className="text-sm font-medium tabular-nums">{displayScore}</span>
  );
}
