import {
  AlertTriangleIcon,
  BookOpenTextIcon,
  FileBadge2Icon,
  FileOutputIcon,
  FileTextIcon,
  FilesIcon,
} from "@/components/icons";
import { Card, CardContent } from "@/components/ui/card";

export function DocumentStatsCards({
  stats,
}: {
  stats: {
    totalDocuments: number;
    cvVersions: number;
    coverLetters: number;
    researchDocs: number;
    pdfExports: number;
    failedExports: number;
  };
}) {
  const items = [
    { label: "Total Documents", value: stats.totalDocuments, helper: "Across all document types", icon: <FilesIcon size={20} /> },
    { label: "CV Versions", value: stats.cvVersions, helper: "Role-specific CV library", icon: <FileBadge2Icon size={20} /> },
    { label: "Cover Letters", value: stats.coverLetters, helper: "Tailored role drafts", icon: <FileTextIcon size={20} /> },
    { label: "Research Docs", value: stats.researchDocs, helper: "Company research files", icon: <BookOpenTextIcon size={20} /> },
    { label: "PDF Exports", value: stats.pdfExports, helper: "Export automation output", icon: <FileOutputIcon size={20} /> },
    { label: "Failed Exports", value: stats.failedExports, helper: "Needs retry/review", icon: <AlertTriangleIcon size={20} /> },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[var(--text-3)]">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold text-[var(--text-1)]">{item.value}</p>
                <p className="mt-1 text-xs text-[var(--text-3)]">{item.helper}</p>
              </div>
              <div className="rounded-lg bg-[var(--accent-bg)] p-2.5 text-[var(--accent-hi)]">{item.icon}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
