"use client";

import { APP_CONFIG } from "@qbs-autonaim/config";
import { Alert, AlertDescription, AlertTitle } from "@qbs-autonaim/ui";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function DemoBanner() {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!APP_CONFIG.isDemo) {
    return null;
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <Alert className="mb-6">
      <AlertTitle>🚀 Демо-доступ</AlertTitle>
      <AlertDescription>
        <p className="mb-3">Для входа используйте демо-аккаунт:</p>

        <div className="space-y-2">
          <div className="flex items-center justify-between py-1 px-2 rounded">
            <div>
              <div className="text-xs font-medium text-muted-foreground">
                Email
              </div>
              <div className="font-mono text-xs">recruiter@demo.qbs.com</div>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard("recruiter@demo.qbs.com", "email")}
              className="p-1 hover:bg-muted rounded"
              aria-label="Копировать email"
            >
              {copiedField === "email" ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between py-1 px-2 rounded">
            <div>
              <div className="text-xs font-medium text-muted-foreground">
                Пароль
              </div>
              <div className="font-mono text-xs">demo123456</div>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard("demo123456", "password")}
              className="p-1 hover:bg-muted rounded"
              aria-label="Копировать пароль"
            >
              {copiedField === "password" ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
