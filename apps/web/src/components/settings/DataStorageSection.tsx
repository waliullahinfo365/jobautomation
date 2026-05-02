import type { StorageSettings } from "@/types/settings";
import { SettingSectionCard } from "./SettingSectionCard";
import { Button } from "@/components/ui/button";

export function DataStorageSection({ storage }: { storage: StorageSettings }) {
  return (
    <SettingSectionCard title="Data & Storage" description="Storage and retention placeholders for the production setup.">
      <div className="space-y-2 text-sm">
        <Field label="Database" value={storage.database} />
        <Field label="File Storage" value={storage.fileStorage} />
        <Field label="PDF Exports Folder" value={storage.pdfExportsFolder} />
        <Field label="Data Retention" value={storage.dataRetention} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline">Export Data</Button>
        <Button variant="destructive">Delete Workspace</Button>
      </div>
    </SettingSectionCard>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--text-3)]">{label}</p>
      <p className="text-[var(--text-2)]">{value}</p>
    </div>
  );
}
