"use client";

interface SuggestionChipProps {
  text: string;
  onClick?: () => void;
}

export function SuggestionChip({ text, onClick }: SuggestionChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="rounded-full border bg-background px-3 py-1.5 text-sm transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {text}
    </button>
  );
}
