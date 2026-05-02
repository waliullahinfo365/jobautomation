"use client";

import type { AutomationModule, AutomationStatus } from "@/types/automation";
import { AutomationModuleCard } from "./AutomationModuleCard";

interface AutomationModulesGridProps {
  modules: AutomationModule[];
  onViewDetails: (module: AutomationModule) => void;
  onToggleStatus: (moduleId: string, status: AutomationStatus) => void;
  onConfigure?: (module: AutomationModule) => void;
}

export function AutomationModulesGrid({
  modules,
  onViewDetails,
  onToggleStatus,
  onConfigure,
}: AutomationModulesGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {modules.map((module) => (
        <AutomationModuleCard
          key={module.id}
          module={module}
          onView={onViewDetails}
          onToggle={onToggleStatus}
          onConfigure={onConfigure}
        />
      ))}
    </div>
  );
}
