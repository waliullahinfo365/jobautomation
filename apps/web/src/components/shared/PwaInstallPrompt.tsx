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
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-2)] p-4 space-y-3">
      <p className="text-sm font-medium">{t("pwa.installTitle")}</p>
      <p className="text-xs text-muted-foreground">{t("pwa.installDescription")}</p>
      <div className="flex flex-wrap gap-2">
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
