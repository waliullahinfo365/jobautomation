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
import { me } from "@/lib/api/auth.api";
import { getUserPreferences, updateUserPreferences } from "@/lib/api/user-preferences.api";
import type { NotificationPreferences } from "@/types/settings";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0] ?? "U").slice(0, 2).toUpperCase();
}

function mergeNotificationPrefs(
  base: NotificationPreferences,
  saved?: NotificationPreferences | null
): NotificationPreferences {
  if (!saved || typeof saved !== "object") return base;
  return {
    channels: {
      email: saved.channels?.email ?? base.channels.email,
      dashboard: saved.channels?.dashboard ?? base.channels.dashboard,
      slack: saved.channels?.slack ?? base.channels.slack,
    },
    events: { ...base.events, ...(saved.events ?? {}) },
  };
}

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
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const billing = useBillingApi({ fallbackToMock: false });
  const uiVariant = advancedUi ? "advanced" : "simple";
  const checkoutHandled = useRef(false);

  useEffect(() => {
    let mounted = true;
    void me()
      .then((session) => {
        if (!mounted) return;
        const user = session.user;
        const tenant = session.tenant;
        setProfile((prev) => ({
          ...prev,
          name: user?.name ?? prev.name,
          email: user?.email ?? prev.email,
          workspaceName: tenant?.name ?? prev.workspaceName,
          role: user?.role ?? prev.role,
          avatarUrl: user?.avatarUrl,
          avatarInitials: initialsFromName(user?.name ?? prev.name),
        }));
      })
      .catch(() => {
        /* keep mock fallback */
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    void getUserPreferences()
      .then((prefs) => {
        if (!mounted) return;
        setNotifications((prev) => mergeNotificationPrefs(prev, prefs.notifications ?? null));
        setNotificationsLoaded(true);
      })
      .catch(() => {
        if (mounted) setNotificationsLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const saveNotifications = async () => {
    setSavingNotifications(true);
    try {
      await updateUserPreferences({ notifications });
      showSuccess(t("settings.notifications.saveSuccess"));
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to save notification preferences");
    } finally {
      setSavingNotifications(false);
    }
  };

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
        <ProfileSection
          profile={profile}
          onChange={setProfile}
          onAvatarUpdated={(avatarUrl) => setProfile((prev) => ({ ...prev, avatarUrl }))}
          variant={uiVariant}
        />
      ) : null}
      {activeSection === "Automation Rules" ? <AutomationRulesSection rules={rules} onChange={setRules} /> : null}
      {activeSection === "Notifications" ? (
        <div className="space-y-4">
          <NotificationsSection preferences={notifications} onChange={setNotifications} variant={uiVariant} />
          <div className="flex justify-end">
            <Button onClick={() => void saveNotifications()} disabled={savingNotifications || !notificationsLoaded}>
              {savingNotifications ? "Saving…" : t("settings.saveChanges")}
            </Button>
          </div>
        </div>
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
      <SimplePageShell className="space-y-4 md:space-y-6">
        <SimplePageHeader title={t("settings.simpleTitle")} description={t("settings.simpleDescription")} />
        <div className="md:hidden">
          <SettingsMobileTabs sections={sections} activeSection={activeSection} />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="hidden md:block">
            <div className="sticky top-20">
              <SettingsNavigation sections={sections} activeSection={activeSection} />
            </div>
          </aside>
          <div className="min-w-0 max-w-5xl">{content}</div>
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
        actions={
          activeSection === "Notifications" ? (
            <Button
              className="hidden sm:inline-flex"
              onClick={() => void saveNotifications()}
              disabled={savingNotifications || !notificationsLoaded}
            >
              {savingNotifications ? "Saving…" : t("settings.saveChanges")}
            </Button>
          ) : (
            <Button className="hidden sm:inline-flex" disabled>
              {t("settings.saveChanges")}
            </Button>
          )
        }
      />

      <div className="md:hidden">
        <SettingsMobileTabs sections={sections} activeSection={activeSection} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden md:block">
          <div className="sticky top-20">
            <SettingsNavigation sections={sections} activeSection={activeSection} />
          </div>
        </aside>
        <div className="min-w-0 max-w-6xl">{content}</div>
      </div>
    </div>
  );
}
