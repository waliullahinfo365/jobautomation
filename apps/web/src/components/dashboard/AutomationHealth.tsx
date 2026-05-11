import Link from "next/link";
import { AutomationIcon } from "@/components/icons";
import type { AutomationModule } from "@/types/automation";
import { AutomationModuleCard } from "@/components/automation/AutomationModuleCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AutomationHealthProps {
  modules: AutomationModule[];
}

export function AutomationHealth({ modules }: AutomationHealthProps) {
  const activeCount  = modules.filter((m) => m.status === "Active").length;
  const pausedCount  = modules.filter((m) => m.status === "Paused").length;
  const failedCount  = modules.filter((m) => m.status === "Failed" || m.status === "Needs Setup").length;

  return (
    <section className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex items-center gap-2">
            <AutomationIcon size={16} className="text-[var(--text-3)]" />
            <h3 className="text-sm font-semibold text-[var(--text-1)]">Automation Health</h3>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="success">{activeCount} Active</Badge>
            <Badge variant="warning">{pausedCount} Paused</Badge>
            <Badge variant="danger">{failedCount} Needs attention</Badge>
            <Link href="/automation" className="rounded-md border border-[var(--border-default)] px-2.5 py-1 font-medium text-[var(--text-2)] hover:bg-[var(--surface-3)]">
              Manage
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <AutomationModuleCard key={module.id} module={module} />
        ))}
      </div>
    </section>
  );
}
