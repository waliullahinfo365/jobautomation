import type { SettingsSection } from "@/types/settings";

/** Maps persisted SettingsSection ids to i18n keys under `settings.section.*` */
export const SETTINGS_SECTION_I18N_KEY: Record<SettingsSection, string> = {
  Profile: "settings.section.profile",
  Integrations: "settings.section.integrations",
  "Automation Rules": "settings.section.automationRules",
  Notifications: "settings.section.notifications",
  "Data & Storage": "settings.section.dataStorage",
  Security: "settings.section.security",
  Billing: "settings.section.billing",
};
