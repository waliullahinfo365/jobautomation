"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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
import { showError, showSuccess } from "@/lib/ui/toast";
import { useTranslation } from "@/i18n/useTranslation";

const sections: SettingsSection[] = [
  "Profile",
  "Integrations",
  "Automation Rules",
  "Notifications",
  "Data & Storage",
  "Security",
  "Billing",
];

export function SettingsPageClient() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<SettingsSection>("Integrations");
  const [profile, setProfile] = useState(mockProfileSettings);
  const [rules, setRules] = useState(mockAutomationRules);
  const [notifications, setNotifications] = useState(mockNotificationPreferences);
  const billing = useBillingApi({ fallbackToMock: false });

  useEffect(() => {
    const section = searchParams.get("section");
    if (section === "Billing") {
      setActiveSection("Billing");
    }
    const integration = searchParams.get("integration");
    if (integration === "connected" || integration === "error" || searchParams.get("error")) {
      setActiveSection("Integrations");
    }
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      setActiveSection("Billing");
      showSuccess(t("settings.billing.checkoutSuccess"));
      void billing.plan.refetch();
      void billing.usage.refetch();
    } else if (checkout === "cancelled") {
      setActiveSection("Billing");
      showError(t("settings.billing.checkoutCancelled"));
    }
  }, [searchParams, t, billing.plan, billing.usage]);

  return (
    <div className="space-y-4 lg:space-y-6">
      <PageHeader
        icon={SettingsIcon}
        eyebrow={t("settings.eyebrow")}
        title={t("settings.title")}
        description={t("settings.description")}
        actions={<Button className="hidden sm:inline-flex">{t("settings.saveChanges")}</Button>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px,1fr] lg:gap-6">
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
          {activeSection === "Billing" ? (
            <BillingSection
              billing={(billing.plan.data as any) ?? {}}
              loading={billing.plan.loading || billing.usage.loading}
              error={billing.plan.error?.message ?? billing.usage.error?.message ?? null}
              onRetry={() => {
                void billing.plan.refetch();
                void billing.usage.refetch();
              }}
              onCheckout={async (planKey, billingCycle) => {
                try {
                  const result = await billing.checkout({ planKey, billingCycle });
                  const checkoutUrl = (result as any)?.checkoutUrl;
                  if (checkoutUrl) {
                    window.location.href = checkoutUrl;
                  } else {
                    showError("No checkout URL returned. Check Stripe configuration.");
                  }
                } catch (error) {
                  showError(error instanceof Error ? error.message : "Failed to open checkout");
                }
              }}
              onOpenPortal={async () => {
                try {
                  const result = await billing.portal(undefined as never);
                  const portalUrl = (result as any)?.portalUrl;
                  if (portalUrl) {
                    window.location.href = portalUrl;
                  } else {
                    showError("No portal URL returned. Check Stripe configuration.");
                  }
                } catch (error) {
                  showError(error instanceof Error ? error.message : "Failed to open billing portal");
                }
              }}
              onCancelSubscription={async () => {
                if (!window.confirm(t("settings.billing.cancelConfirm"))) return;
                try {
                  await billing.cancel(undefined as never);
                  showSuccess(t("settings.billing.cancelScheduled"));
                  void billing.plan.refetch();
                } catch (error) {
                  showError(error instanceof Error ? error.message : t("settings.billing.cancelFailed"));
                }
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
