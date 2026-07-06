import type { SettingsSection } from "@/types/settings";

export function settingsSectionHref(section: SettingsSection): string {
  return `/settings?section=${encodeURIComponent(section)}`;
}

export function resolveSettingsSection(
  searchParams: Pick<URLSearchParams, "get">,
  sections: SettingsSection[],
  defaultSection: SettingsSection
): SettingsSection {
  const integration = searchParams.get("integration");
  if (integration === "connected" || integration === "error") {
    return "Integrations";
  }

  const checkout = searchParams.get("checkout");
  if (checkout === "success" || checkout === "cancelled") {
    return "Billing";
  }

  const section = searchParams.get("section") as SettingsSection | null;
  if (section && sections.includes(section)) {
    return section;
  }

  return defaultSection;
}
