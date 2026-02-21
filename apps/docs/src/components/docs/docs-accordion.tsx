"use client";

import { cn } from "@qbs-autonaim/ui/utils";
import { ChevronDown } from "lucide-react";
import type React from "react";
import { useState } from "react";

interface AccordionItem {
  title: string;
  content: React.ReactNode;
}

interface DocsAccordionProps {
  items: AccordionItem[];
}

export function DocsAccordion({ items }: DocsAccordionProps) {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  return (
    <div className="my-6 divide-y divide-border rounded-lg border border-border">
      {items.map((item, index) => (
        <div key={`accordion-${index}-${item.title}`}>
          <button
            type="button"
            onClick={() => toggleItem(index)}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            {item.title}
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                openItems.includes(index) && "rotate-180",
              )}
            />
          </button>
          <div
            className={cn(
              "overflow-hidden transition-all duration-200",
              openItems.includes(index) ? "max-h-96" : "max-h-0",
            )}
          >
            <div className="px-4 pb-4 text-sm text-muted-foreground">
              {item.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
