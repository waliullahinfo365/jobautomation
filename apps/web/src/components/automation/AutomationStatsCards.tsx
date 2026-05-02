import {
  AlertTriangleIcon,
  BotIcon,
  CheckCircleIcon,
  GaugeIcon,
  PlayCircleIcon,
  WrenchIcon,
} from "@/components/icons";
import { Card, CardContent } from "@/components/ui/card";
import type { ReactNode } from "react";

interface AutomationStatsCardsProps {
  stats: {
    totalAutomations: number;
    activeModules: number;
    failedModules: number;
    needsSetup: number;
    runsToday: number;
    averageSuccessRate: number;
  };
}

function StatCard({ label, value, helper, icon }: { label: string; value: string | number; helper: string; icon: ReactNode }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-[var(--text-3)]">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--text-1)]">{value}</p>
            <p className="mt-1 text-xs text-[var(--text-3)]">{helper}</p>
          </div>
          <div className="rounded-lg bg-[var(--accent-bg)] p-2.5 text-[var(--accent-hi)]">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AutomationStatsCards({ stats }: AutomationStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      <StatCard label="Total Automations" value={stats.totalAutomations} helper="Configured modules" icon={<BotIcon size={20} />} />
      <StatCard label="Active Modules" value={stats.activeModules} helper="Currently running" icon={<CheckCircleIcon size={20} />} />
      <StatCard label="Failed Modules" value={stats.failedModules} helper="Require immediate review" icon={<AlertTriangleIcon size={20} />} />
      <StatCard label="Needs Setup" value={stats.needsSetup} helper="Pending integrations" icon={<WrenchIcon size={20} />} />
      <StatCard label="Runs Today" value={stats.runsToday} helper="Across all modules" icon={<PlayCircleIcon size={20} />} />
      <StatCard label="Average Success Rate" value={`${stats.averageSuccessRate}%`} helper="Rolling 24h average" icon={<GaugeIcon size={20} />} />
    </div>
  );
}
