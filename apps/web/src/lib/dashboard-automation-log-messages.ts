import type { AutomationLog } from "@/types/automation";

function replaceParams(template: string, params: Record<string, string>): string {
  let out = template;
  for (const [k, v] of Object.entries(params)) {
    out = out.replaceAll(`{{${k}}}`, v);
  }
  return out;
}

/**
 * Dashboard-only: map known technical / mock log lines to i18n keys with optional params.
 */
export function formatDashboardAutomationLogMessage(log: AutomationLog, t: (key: string) => string): string {
  const raw = (log.technicalMessage ?? log.message ?? "").trim();
  if (!raw) return t("dashboard.logs.emptyMessage");

  const gmail = raw.match(/Gmail intake processed (\d+) messages[^.;]*created (\d+) jobs/i);
  if (gmail) {
    return replaceParams(t("dashboard.logs.gmailIntakeProcessed"), {
      messages: gmail[1] ?? "0",
      jobs: gmail[2] ?? "0",
    });
  }

  if (
    /automation job queued via api queue facade/i.test(raw) ||
    /queued via api queue/i.test(raw) ||
    (/queue facade/i.test(raw) && /queued/i.test(raw)) ||
    /automation run queued/i.test(raw) ||
    /automation job queued/i.test(raw)
  ) {
    return t("dashboard.logs.automationJobQueued");
  }

  const mockById: Record<string, { moduleKey: string; detailKey: string }> = {
    act_001: { moduleKey: "dashboard.logs.mock.act001Module", detailKey: "dashboard.logs.mock.act001Detail" },
    act_002: { moduleKey: "dashboard.logs.mock.act002Module", detailKey: "dashboard.logs.mock.act002Detail" },
    act_003: { moduleKey: "dashboard.logs.mock.act003Module", detailKey: "dashboard.logs.mock.act003Detail" },
    act_004: { moduleKey: "dashboard.logs.mock.act004Module", detailKey: "dashboard.logs.mock.act004Detail" },
    act_005: { moduleKey: "dashboard.logs.mock.act005Module", detailKey: "dashboard.logs.mock.act005Detail" },
    act_006: { moduleKey: "dashboard.logs.mock.act006Module", detailKey: "dashboard.logs.mock.act006Detail" },
    act_007: { moduleKey: "dashboard.logs.mock.act007Module", detailKey: "dashboard.logs.mock.act007Detail" },
    act_008: { moduleKey: "dashboard.logs.mock.act008Module", detailKey: "dashboard.logs.mock.act008Detail" },
  };

  const mapped = mockById[log.id];
  if (mapped) return t(mapped.detailKey);

  return raw;
}

export function formatDashboardAutomationLogModuleName(log: AutomationLog, t: (key: string) => string): string {
  const mockById: Record<string, string> = {
    act_001: "dashboard.logs.mock.act001Module",
    act_002: "dashboard.logs.mock.act002Module",
    act_003: "dashboard.logs.mock.act003Module",
    act_004: "dashboard.logs.mock.act004Module",
    act_005: "dashboard.logs.mock.act005Module",
    act_006: "dashboard.logs.mock.act006Module",
    act_007: "dashboard.logs.mock.act007Module",
    act_008: "dashboard.logs.mock.act008Module",
  };
  const key = mockById[log.id];
  if (key) return t(key);
  return log.moduleName;
}
