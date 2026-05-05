"use client";

import { CloseIcon } from "@/components/icons";
import type { AutomationModule } from "@/types/automation";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/shared/SectionCard";
import { AutomationStatusBadge } from "./AutomationStatusBadge";
import { AutomationCategoryBadge } from "./AutomationCategoryBadge";
import { AutomationHealthMetrics } from "./AutomationHealthMetrics";
import { formatDate } from "@/lib/utils";
import { friendlyAutomationLogMessage } from "@/lib/automationLogMessaging";
import { Badge } from "@/components/ui/badge";
import { AnimatePresence, motion } from "framer-motion";

interface AutomationDetailPanelProps {
  module: AutomationModule | null;
  open: boolean;
  onClose: () => void;
  onRun?: (module: AutomationModule) => void;
  onConfigure?: (module: AutomationModule) => void;
}

export function AutomationDetailPanel({ module, open, onClose, onRun, onConfigure }: AutomationDetailPanelProps) {
  return (
    <AnimatePresence>
      {open && module ? (
        <div className="fixed inset-0 z-50 flex">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 bg-black/40"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 24, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="h-full w-full max-w-2xl overflow-y-auto border-l border-border bg-card p-6"
          >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-1)]">{module.name}</h2>
            <p className="mt-1 text-sm text-[var(--text-2)]">{module.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <AutomationStatusBadge status={module.status} />
              <AutomationCategoryBadge category={module.category} />
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <CloseIcon size={20} />
          </Button>
        </div>

        <div className="space-y-5">
          <SectionCard title="Health Metrics">
            <AutomationHealthMetrics module={module} />
          </SectionCard>

          <SectionCard title="Trigger Info">
            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <Info label="Trigger Type" value={module.triggerType} />
              <Info label="Trigger Source" value={module.triggerSource} />
              <Info label="Schedule" value={module.schedule} />
              <Info label="Input Source" value={module.inputSource} />
            </div>
          </SectionCard>

          <SectionCard title="Actions Performed">
            <div className="space-y-2">
              {module.actions.map((action) => (
                <div key={action.id} className="rounded-lg border border-[var(--border-default)] p-3">
                  <p className="text-sm font-medium text-[var(--text-1)]">{action.title}</p>
                  <p className="text-xs text-[var(--text-3)]">{action.detail}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Recent Logs">
            <div className="space-y-2">
              {module.recentLogs?.length ? (
                module.recentLogs.map((log) => (
                  <div key={log.id} className="rounded-lg border border-[var(--border-default)] p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <Badge variant={log.status === "Success" ? "success" : log.status === "Warning" ? "warning" : "danger"}>
                        {log.status}
                      </Badge>
                      <span className="text-xs text-[var(--text-4)]">{formatDate(log.createdAt, "MMM d, HH:mm")}</span>
                    </div>
                    <p className="text-sm text-[var(--text-2)]">
                      {friendlyAutomationLogMessage(log.technicalMessage ?? log.message)}
                    </p>
                    <p className="text-xs text-[var(--text-3)]">Related: {log.relatedRecord} • Duration: {log.duration}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--text-3)]">No recent logs for this module.</p>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Configuration Preview">
            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <Info label="Connected Account" value={module.configuration.connectedAccount} />
              <Info label="Environment" value={module.configuration.environment} />
              <Info label="Retry Policy" value={module.configuration.retryPolicy} />
              <Info label="Error Handling" value={module.configuration.errorHandling} />
            </div>
          </SectionCard>

          <div className="flex flex-wrap gap-2 border-t border-[var(--border-default)] pt-5">
            <Button type="button" variant="default" onClick={() => module && onRun?.(module)}>
              Run Now
            </Button>
            <Button type="button" variant="outline" onClick={() => module && onConfigure?.(module)}>
              Configure
            </Button>
          </div>
        </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--text-3)]">{label}</p>
      <p className="font-medium text-[var(--text-1)]">{value}</p>
    </div>
  );
}
