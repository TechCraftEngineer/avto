"use client";

import { cn } from "@qbs-autonaim/ui/utils";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface DocsCodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
}

export function DocsCodeBlock({
  code,
  language = "bash",
  title,
  showLineNumbers = false,
}: DocsCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split("\n");

  return (
    <div className="group relative my-4 overflow-hidden rounded-lg border border-border bg-muted/50">
      {title && (
        <div className="flex items-center justify-between border-b border-border bg-muted/80 px-4 py-2">
          <span className="text-xs font-medium text-muted-foreground">
            {title}
          </span>
          <span className="text-xs text-muted-foreground">{language}</span>
        </div>
      )}
      <div className="relative">
        <pre
          className={cn(
            "overflow-x-auto p-4 text-sm",
            showLineNumbers && "pl-12",
          )}
        >
          <code className="font-mono text-foreground">
            {showLineNumbers
              ? lines.map((line, i) => (
                  <div
                    key={`line-${i}-${line.substring(0, 20)}`}
                    className="table-row"
                  >
                    <span className="table-cell select-none pr-4 text-right text-muted-foreground/50">
                      {i + 1}
                    </span>
                    <span className="table-cell">{line}</span>
                  </div>
                ))
              : code}
          </code>
        </pre>
        <button
          type="button"
          onClick={copyToClipboard}
          className={cn(
            "absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-all hover:bg-accent hover:text-foreground",
            !title && "opacity-0 group-hover:opacity-100",
          )}
          aria-label="Скопировать код"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          <span className="sr-only">Скопировать код</span>
        </button>
      </div>
    </div>
  );
}
