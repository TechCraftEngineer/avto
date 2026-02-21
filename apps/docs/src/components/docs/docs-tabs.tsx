"use client";

import { cn } from "@qbs-autonaim/ui/utils";
import type React from "react";
import { useState } from "react";

interface Tab {
  label: string;
  value: string;
  content: React.ReactNode;
}

interface DocsTabsProps {
  tabs: Tab[];
  defaultValue?: string;
}

export function DocsTabs({ tabs, defaultValue }: DocsTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue || tabs[0]?.value);

  return (
    <div className="my-6">
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "relative px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.value
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {activeTab === tab.value && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>
      <div className="pt-4">
        {tabs.find((tab) => tab.value === activeTab)?.content}
      </div>
    </div>
  );
}
