import { cn } from "@qbs-autonaim/ui";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import type { ProgressStatus } from "./types";

interface StatusIconProps {
  status?: ProgressStatus;
}

export function StatusIcon({ status }: StatusIconProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center w-8 h-8 rounded-full text-white shrink-0",
        status === "started" && "bg-blue-500",
        status === "processing" && "bg-blue-500",
        status === "completed" && "bg-green-500",
        status === "error" && "bg-red-500",
        !status && "bg-blue-500",
      )}
      aria-hidden="true"
    >
      {status === "started" && <Loader2 className="h-4 w-4 animate-pulse" />}
      {status === "processing" && <Loader2 className="h-4 w-4 animate-spin" />}
      {status === "completed" && <CheckCircle2 className="h-4 w-4" />}
      {status === "error" && <XCircle className="h-4 w-4" />}
      {!status && <Loader2 className="h-4 w-4 animate-spin" />}
    </div>
  );
}
