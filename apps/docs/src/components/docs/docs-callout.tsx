import { cn } from "@qbs-autonaim/ui/utils";
import { AlertCircle, AlertTriangle, Info, Lightbulb } from "lucide-react";
import type React from "react";

type CalloutType = "info" | "warning" | "tip" | "note";

interface DocsCalloutProps {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}

const calloutConfig = {
  info: {
    icon: Info,
    className: "border-blue-500/30 bg-blue-500/5",
    iconClassName: "text-blue-500",
  },
  warning: {
    icon: AlertTriangle,
    className: "border-amber-500/30 bg-amber-500/5",
    iconClassName: "text-amber-500",
  },
  tip: {
    icon: Lightbulb,
    className: "border-green-500/30 bg-green-500/5",
    iconClassName: "text-green-500",
  },
  note: {
    icon: AlertCircle,
    className: "border-border bg-muted/50",
    iconClassName: "text-muted-foreground",
  },
};

export function DocsCallout({
  type = "note",
  title,
  children,
}: DocsCalloutProps) {
  const config = calloutConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn("my-6 flex gap-3 rounded-lg border p-4", config.className)}
    >
      <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", config.iconClassName)} />
      <div className="flex-1">
        {title && <p className="font-semibold text-foreground mb-1">{title}</p>}
        <div className="text-sm text-foreground/80 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}
