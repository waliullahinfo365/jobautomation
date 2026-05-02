import type { TenantRole } from "../types/user";

/** Canonical permission strings for RBAC checks */
export const PERMISSIONS = [
  "tenant.read",
  "tenant.update",
  "users.read",
  "users.invite",
  "users.update",
  "users.remove",
  "billing.read",
  "billing.update",
  "jobs.read",
  "jobs.create",
  "jobs.update",
  "jobs.archive",
  "applications.read",
  "applications.create",
  "applications.update",
  "contacts.read",
  "contacts.create",
  "contacts.update",
  "interviews.read",
  "interviews.create",
  "interviews.update",
  "documents.read",
  "documents.create",
  "documents.update",
  "automation.read",
  "automation.run",
  "automation.update",
  "integrations.read",
  "integrations.connect",
  "integrations.disconnect",
  "reports.read",
  "reports.generate",
  "settings.read",
  "settings.update",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL = [...PERMISSIONS] as Permission[];

const without = (xs: Permission[], ...drop: Permission[]): Permission[] => xs.filter((p) => !drop.includes(p));

/** Owner — full access */
const OWNER: Permission[] = ALL;

/**
 * Admin — everything except destructive billing changes and removing users (owner-only).
 */
const ADMIN: Permission[] = without(ALL, "billing.update", "users.remove");

/**
 * Member — workspace CRUD on core entities; can generate reports; automation/integrations read-only.
 */
const MEMBER: Permission[] = [
  "tenant.read",
  "users.read",
  "billing.read",
  "jobs.read",
  "jobs.create",
  "jobs.update",
  "jobs.archive",
  "applications.read",
  "applications.create",
  "applications.update",
  "contacts.read",
  "contacts.create",
  "contacts.update",
  "interviews.read",
  "interviews.create",
  "interviews.update",
  "documents.read",
  "documents.create",
  "documents.update",
  "automation.read",
  "integrations.read",
  "reports.read",
  "reports.generate",
  "settings.read",
];

/** Viewer — read-only across product surfaces */
const VIEWER: Permission[] = [
  "tenant.read",
  "users.read",
  "billing.read",
  "jobs.read",
  "applications.read",
  "contacts.read",
  "interviews.read",
  "documents.read",
  "automation.read",
  "integrations.read",
  "reports.read",
  "settings.read",
];

export const ROLE_PERMISSIONS: Record<TenantRole, Permission[]> = {
  Owner: OWNER,
  Admin: ADMIN,
  Member: MEMBER,
  Viewer: VIEWER,
};

export function roleHasPermission(role: TenantRole | string | undefined, permission: Permission): boolean {
  if (!role) return false;
  const r = role as TenantRole;
  const set = ROLE_PERMISSIONS[r];
  if (!set) return false;
  return set.includes(permission);
}
