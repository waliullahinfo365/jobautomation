import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import type { FolderActivityRecord, FolderAutomationSettings } from "@/types/document";
import { FolderTreePreview } from "./FolderTreePreview";
import { FolderActivityTable } from "./FolderActivityTable";

export function FolderAutomationSection({
  activity,
  settings,
  onChange,
  onProvisionJobFolder,
  provisionDisabled,
}: {
  activity: FolderActivityRecord[];
  settings: FolderAutomationSettings;
  onChange: (next: FolderAutomationSettings) => void;
  onProvisionJobFolder?: () => void | Promise<void>;
  provisionDisabled?: boolean;
}) {
  return (
    <div className="space-y-6">
      <FolderTreePreview />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" disabled={provisionDisabled} onClick={() => void onProvisionJobFolder?.()}>
          Provision Job Folder
        </Button>
      </div>
      <FolderActivityTable records={activity} />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Automation Settings Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Row label="Auto-create folder on new job">
            <Switch checked={settings.autoCreateFolderOnNewJob} onCheckedChange={(checked) => onChange({ ...settings, autoCreateFolderOnNewJob: checked })} />
          </Row>
          <Row label="Move CV on ready-to-apply">
            <Switch checked={settings.moveCVOnReadyToApply} onCheckedChange={(checked) => onChange({ ...settings, moveCVOnReadyToApply: checked })} />
          </Row>
          <Row label="Export final documents as PDF">
            <Switch checked={settings.exportFinalDocumentsAsPDF} onCheckedChange={(checked) => onChange({ ...settings, exportFinalDocumentsAsPDF: checked })} />
          </Row>
          <div>
            <p className="text-xs text-[var(--text-3)]">Naming convention</p>
            <p className="text-sm font-medium text-[var(--text-1)]">{settings.namingConvention}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-[var(--text-2)]">{label}</p>
      {children}
    </div>
  );
}
