import { CheckCircle2, XCircle } from "lucide-react";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

interface ValueChangeDisplayProps {
  oldValue: JsonValue | null | undefined;
  newValue: JsonValue | null | undefined;
}

function formatValue(value: JsonValue | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

export function ValueChangeDisplay({
  oldValue,
  newValue,
}: ValueChangeDisplayProps) {
  if (
    oldValue === null ||
    oldValue === undefined ||
    newValue === null ||
    newValue === undefined
  ) {
    return null;
  }

  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center gap-2 text-xs">
        <XCircle className="h-3 w-3 text-destructive" />
        <span className="text-muted-foreground">
          Было: <span className="font-mono">{formatValue(oldValue)}</span>
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <CheckCircle2 className="h-3 w-3 text-green-500" />
        <span className="text-muted-foreground">
          Стало: <span className="font-mono">{formatValue(newValue)}</span>
        </span>
      </div>
    </div>
  );
}
