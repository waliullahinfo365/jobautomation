"use client";

import { SectionCard } from "@/components/shared/SectionCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/useTranslation";
import type { CVVersion } from "@/types/document";
import { DocumentStatusBadge } from "./DocumentStatusBadge";

export function CVLibrarySection({
  records,
  onSetDefault,
  onView,
}: {
  records: CVVersion[];
  onSetDefault: (id: string) => void;
  onView?: (cv: CVVersion) => void;
}) {
  const { t, locale } = useTranslation();
  const bcp47 = locale === "de" ? "de-DE" : "en-US";
  const dateFmt = new Intl.DateTimeFormat(bcp47, { month: "short", day: "numeric", year: "numeric" });

  return (
    <SectionCard title={t("documents.cvLibrary.title")} description={t("documents.cvLibrary.subtitle")}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {records.map((cv) => (
          <Card key={cv.id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-[var(--text-1)]">{cv.cvName}</p>
                  <p className="text-xs text-[var(--text-3)]">{cv.targetRole} · {cv.industry}</p>
                </div>
                {cv.isDefault ? <Badge variant="success">{t("documents.cvLibrary.default")}</Badge> : null}
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--text-3)]">
                <Badge variant="default">{cv.version}</Badge>
                <DocumentStatusBadge status={cv.status} />
              </div>
              <p className="text-xs text-[var(--text-3)]">{t("documents.cvLibrary.usedInApplications").replace("{count}", String(cv.usedInApplicationsCount))}</p>
              <p className="text-xs text-[var(--text-3)]">{t("documents.cvLibrary.updated")} {dateFmt.format(new Date(cv.lastUpdated))}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => onView?.(cv)}>{t("documents.actions.view")}</Button>
                <Button size="sm" variant="secondary" onClick={() => onSetDefault(cv.id)}>{t("documents.actions.setDefault")}</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </SectionCard>
  );
}
