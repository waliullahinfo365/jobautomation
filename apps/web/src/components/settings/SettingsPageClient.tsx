"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { SimplePageHeader } from "@/components/shared/SimplePageHeader";
import { SimplePageShell } from "@/components/shared/SimplePageShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { SettingsIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { SettingsNavigation } from "./SettingsNavigation";
import { SettingsMobileTabs } from "./SettingsMobileTabs";
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
import { useAdvancedUi } from "@/context/AuthSessionContext";
import { showError, showSuccess } from "@/lib/ui/toast";
import { useTranslation } from "@/i18n/useTranslation";
import { resolveSettingsSection, settingsSectionHref } from "@/lib/settings-routing";

const ADVANCED_SECTIONS: SettingsSection[] = [
  "Profile",
  "Integrations",
  "Automation Rules",
  "Notifications",
  "Data & Storage",
  "Security",
  "Billing",
];

const SIMPLE_SECTIONS: SettingsSection[] = ["Profile", "Integrations", "Notifications", "Billing"];

export function SettingsPageClient() {
  const { t } = useTranslation();
  const advancedUi = useAdvancedUi();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sections = useMemo(() => (advancedUi ? ADVANCED_SECTIONS : SIMPLE_SECTIONS), [advancedUi]);
  const defaultSection = advancedUi ? "Integrations" : "Profile";
  const activeSection = useMemo(
    () => resolveSettingsSection(searchParams, sections, defaultSection),
    [searchParams, sections, defaultSection]
  );
  const [profile, setProfile] = useState(mockProfileSettings);
  const [rules, setRules] = useState(mockAutomationRules);
  const [notifications, setNotifications] = useState(mockNotificationPreferences);
  const billing = useBillingApi({ fallbackToMock: false });
  const uiVariant = advancedUi ? "advanced" : "simple";
  const checkoutHandled = useRef(false);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (!checkout) {
      checkoutHandled.current = false;
      return;
    }
    if (checkoutHandled.current) return;
    checkoutHandled.current = true;

    if (checkout === "success") {
      showSuccess(t("settings.billing.checkoutSuccess"));
      void billing.plan.refetch();
      void billing.usage.refetch();
    } else if (checkout === "cancelled") {
      showError(t("settings.billing.checkoutCancelled"));
    }

    router.replace(settingsSectionHref("Billing"), { scroll: false });
  }, [searchParams, t, router, billing.plan.refetch, billing.usage.refetch]);

  const content = (
    <>
      {activeSection === "Integrations" ? <IntegrationsSection variant={uiVariant} /> : null}
      {activeSection === "Profile" ? (
        <ProfileSection profile={profile} onChange={setProfile} variant={uiVariant} />
      ) : null}
      {activeSection === "Automation Rules" ? <AutomationRulesSection rules={rules} onChange={setRules} /> : null}
      {activeSection === "Notifications" ? (
        <NotificationsSection preferences={notifications} onChange={setNotifications} variant={uiVariant} />
      ) : null}
      {activeSection === "Data & Storage" ? <DataStorageSection /> : null}
      {activeSection === "Security" ? <SecuritySection /> : null}
      {activeSection === "Billing" ? (
        <BillingSection
          variant={uiVariant}
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
    </>
  );

  if (!advancedUi) {
    return (
      <SimplePageShell className="space-y-4 lg:max-w-none lg:space-y-6">
        <SimplePageHeader title={t("settings.simpleTitle")} description={t("settings.simpleDescription")} />
        <div className="relative z-40 bg-[var(--bg-0)] pb-3 pt-1 lg:hidden">
          <SettingsMobileTabs sections={sections} activeSection={activeSection} />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px,1fr] lg:gap-6">
          <div className="hidden lg:block">
            <SettingsNavigation sections={sections} activeSection={activeSection} />
          </div>
          <div>{content}</div>
        </div>
      </SimplePageShell>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <PageHeader
        icon={SettingsIcon}
        eyebrow={t("settings.eyebrow")}
        title={t("settings.title")}
        description={t("settings.description")}
        actions={<Button className="hidden sm:inline-flex">{t("settings.saveChanges")}</Button>}
      />

      <div className="relative z-40 bg-[var(--bg-0)] pb-3 pt-1 lg:hidden">
        <SettingsMobileTabs sections={sections} activeSection={activeSection} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px,1fr] lg:gap-6">
        <div className="hidden lg:block">
          <SettingsNavigation sections={sections} activeSection={activeSection} />
        </div>
        <div>{content}</div>
      </div>
    </div>
  );
}
