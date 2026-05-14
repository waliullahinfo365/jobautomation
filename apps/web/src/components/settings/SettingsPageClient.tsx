"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SettingsIcon } from "@/components/icons";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { SettingsNavigation } from "./SettingsNavigation";
import { IntegrationsSection } from "./IntegrationsSection";
import { AutomationRulesSection } from "./AutomationRulesSection";
import { NotificationsSection } from "./NotificationsSection";
import { DataStorageSection } from "./DataStorageSection";
import { SecuritySection } from "./SecuritySection";
import { ProfileSection } from "./ProfileSection";
import { BillingSection } from "./BillingSection";
import type { SettingsSection } from "@/types/settings";
import {
  mockAutomationRules,
  mockNotificationPreferences,
  mockProfileSettings,
} from "@/data/mockSettings";
import { useBillingApi } from "@/hooks/api/useBillingApi";
import { showError, showInfo, showSuccess } from "@/lib/ui/toast";
import { shouldUseMockFallback } from "@/lib/api/mockFallback";
import { useTranslation } from "@/i18n/useTranslation";

const sections: SettingsSection[] = [
  "Profile",
  "Integrations",
  "Automation Rules",
  "Notifications",
  "Data & Storage",
  "Security",
  "Billing Placeholder",
];

export function SettingsPageClient() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<SettingsSection>("Integrations");

  useEffect(() => {
    const integration = searchParams.get("integration");
    if (integration === "connected" || integration === "error" || searchParams.get("error")) {
      setActiveSection("Integrations");
    }
  }, [searchParams]);
  const [profile, setProfile] = useState(mockProfileSettings);
  const [rules, setRules] = useState(mockAutomationRules);
  const [notifications, setNotifications] = useState(mockNotificationPreferences);
  const billing = useBillingApi({ fallbackToMock: false });
  const usingMock = useMemo(() => billing.plan.error ? shouldUseMockFallback(billing.plan.error) : false, [billing.plan.error]);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={SettingsIcon}
        eyebrow={t("settings.eyebrow")}
        title={t("settings.title")}
        description={t("settings.description")}
        actions={<Button>{t("settings.saveChanges")}</Button>}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px,1fr]">
        <div>
          <SettingsNavigation sections={sections} activeSection={activeSection} onChange={setActiveSection} />
        </div>
        <div>
          {activeSection === "Integrations" ? <IntegrationsSection /> : null}
          {activeSection === "Profile" ? <ProfileSection profile={profile} onChange={setProfile} /> : null}
          {activeSection === "Automation Rules" ? <AutomationRulesSection rules={rules} onChange={setRules} /> : null}
          {activeSection === "Notifications" ? <NotificationsSection preferences={notifications} onChange={setNotifications} /> : null}
          {activeSection === "Data & Storage" ? <DataStorageSection /> : null}
          {activeSection === "Security" ? <SecuritySection /> : null}
          {activeSection === "Billing Placeholder" ? (
            <BillingSection
              billing={(billing.plan.data as any) ?? {}}
              loading={billing.plan.loading || billing.usage.loading}
              error={billing.plan.error?.message ?? billing.usage.error?.message ?? null}
              usingMock={usingMock}
              onRetry={() => {
                void billing.plan.refetch();
                void billing.usage.refetch();
              }}
              onChangePlan={async (planKey) => {
                try {
                  await billing.changePlan({ planKey });
                  showSuccess(`Plan change request sent: ${planKey}`);
                  void billing.plan.refetch();
                  void billing.usage.refetch();
                } catch (error) {
                  showError(error instanceof Error ? error.message : "Failed to change plan");
                }
              }}
              onCheckout={async (planKey) => {
                try {
                  await billing.checkout({ planKey, billingCycle: "monthly" });
                  showInfo("Billing not yet configured — Stripe checkout requires setup. Contact support to upgrade.");
                } catch (error) {
                  showError(error instanceof Error ? error.message : "Failed to open checkout");
                }
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
