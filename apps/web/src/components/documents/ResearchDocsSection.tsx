"use client";

import { SectionCard } from "@/components/shared/SectionCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/useTranslation";
import type { ResearchDocumentRecord } from "@/types/document";
import { DocumentStatusBadge } from "./DocumentStatusBadge";

export function ResearchDocsSection({ records }: { records: ResearchDocumentRecord[] }) {
  const { t, locale } = useTranslation();
  const bcp47 = locale === "de" ? "de-DE" : "en-US";
  const dateFmt = new Intl.DateTimeFormat(bcp47, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <SectionCard title={t("documents.research.title")} description={t("documents.research.subtitle")}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {records.map((r) => (
          <Card key={r.id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-[var(--text-1)]">{r.documentName}</p>
                  <p className="text-xs text-[var(--text-3)]">{r.company} · {r.position}</p>
                </div>
                <DocumentStatusBadge status={r.researchStatus} />
              </div>
              <p className="text-sm text-[var(--text-2)]">{r.aiSummarySnippet}</p>
              <p className="text-xs text-[var(--text-3)]">{t("documents.research.created")} {dateFmt.format(new Date(r.createdAt))}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">{t("documents.actions.viewResearch")}</Button>
                <Button size="sm" variant="secondary">{t("documents.actions.update")}</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </SectionCard>
  );
}
