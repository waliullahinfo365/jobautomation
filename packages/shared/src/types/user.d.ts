import type { tenantRoles } from "../constants/plans";
import type { userStatuses } from "../constants/statuses";
/**
 * Workspace membership role for RBAC (`ROLE_PERMISSIONS` in `@jobflow/shared`).
 * Same values as `tenantRoles` in `constants/plans`.
 */
export type TenantRole = (typeof tenantRoles)[number];
/** @deprecated Prefer `TenantRole` — alias retained for clarity in auth code */
export type UserRole = TenantRole;
export type UserStatus = (typeof userStatuses)[number];
export interface User {
    id: string;
    tenantId: string;
    name: string;
    email: string;
    passwordHash: string;
    avatarUrl?: string;
    role: TenantRole;
    status: UserStatus;
    timezone?: string;
    lastLoginAt?: string;
    emailVerifiedAt?: string;
    preferences?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}
