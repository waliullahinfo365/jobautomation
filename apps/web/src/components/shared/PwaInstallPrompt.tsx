"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/useTranslation";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaInstallPrompt() {
  const { t } = useTranslation();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      if (!localStorage.getItem("pwa_install_dismissed")) setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible || !deferred) return null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-2)] p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium text-[var(--text-1)]">{t("pwa.installTitle")}</p>
        <p className="text-xs text-muted-foreground">{t("pwa.installDescription")}</p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => {
            void deferred.prompt().then(() => setVisible(false));
          }}
        >
          {t("pwa.installAction")}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            localStorage.setItem("pwa_install_dismissed", "1");
            setVisible(false);
          }}
        >
          {t("common.notNow")}
        </Button>
      </div>
    </div>
  );
}
