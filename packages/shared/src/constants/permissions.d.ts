import type { TenantRole } from "../types/user";
/** Canonical permission strings for RBAC checks */
export declare const PERMISSIONS: readonly ["tenant.read", "tenant.update", "users.read", "users.invite", "users.update", "users.remove", "billing.read", "billing.update", "jobs.read", "jobs.create", "jobs.update", "jobs.archive", "applications.read", "applications.create", "applications.update", "contacts.read", "contacts.create", "contacts.update", "interviews.read", "interviews.create", "interviews.update", "documents.read", "documents.create", "documents.update", "automation.read", "automation.run", "automation.update", "integrations.read", "integrations.connect", "integrations.disconnect", "reports.read", "reports.generate", "settings.read", "settings.update"];
export type Permission = (typeof PERMISSIONS)[number];
export declare const ROLE_PERMISSIONS: Record<TenantRole, Permission[]>;
export declare function roleHasPermission(role: TenantRole | string | undefined, permission: Permission): boolean;
