import type { SecuritySettings } from "@/types/settings";
import { SettingSectionCard } from "./SettingSectionCard";
import { Button } from "@/components/ui/button";

export function SecuritySection({ security }: { security: SecuritySettings }) {
  return (
    <SettingSectionCard title="Security" description="Security controls are placeholders in this UI phase.">
      <div className="space-y-2 text-sm">
        <Field label="Password" value={security.passwordStatus} />
        <Field label="Two-factor authentication" value={security.twoFactorStatus} />
        <Field label="Active sessions" value={security.activeSessions} />
        <Field label="API keys" value={security.apiKeysStatus} />
        <Field label="Audit logs" value={security.auditLogsStatus} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline">Manage Password</Button>
        <Button variant="outline">Manage Sessions</Button>
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
