"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PERMISSIONS = exports.PERMISSIONS = void 0;
exports.roleHasPermission = roleHasPermission;
/** Canonical permission strings for RBAC checks */
exports.PERMISSIONS = [
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
];
const ALL = [...exports.PERMISSIONS];
const without = (xs, ...drop) => xs.filter((p) => !drop.includes(p));
/** Owner — full access */
const OWNER = ALL;
/**
 * Admin — everything except destructive billing changes and removing users (owner-only).
 */
const ADMIN = without(ALL, "billing.update", "users.remove");
/**
 * Member — workspace CRUD on core entities; can generate reports; automation/integrations read-only.
 */
const MEMBER = [
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
const VIEWER = [
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
exports.ROLE_PERMISSIONS = {
    Owner: OWNER,
    Admin: ADMIN,
    Member: MEMBER,
    Viewer: VIEWER,
};
function roleHasPermission(role, permission) {
    if (!role)
        return false;
    const r = role;
    const set = exports.ROLE_PERMISSIONS[r];
    if (!set)
        return false;
    return set.includes(permission);
}
