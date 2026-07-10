"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/useTranslation";

/** Mobile-first: Gmail + Drive connect here; LinkedIn apply uses Apply Assistant (no server session). */
export function ApplyAssistantIntegrationCard() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("integrations.applyAssistantCard.title")}</CardTitle>
        <CardDescription>{t("integrations.applyAssistantCard.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>{t("integrations.applyAssistantCard.body")}</p>
        <Button asChild variant="default" className="min-h-[44px] w-full sm:w-auto">
          <Link href="/apply-assistant">{t("labels.openApplyAssistant")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
