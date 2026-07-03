import { isPlatformOwnerEmail, OWNER_EMAIL } from "@jobflow/shared/constants/product-roles";
import type { TenantRole } from "@jobflow/shared/types/user";
import { UserModel } from "@jobflow/database/models";

const SUPER_ADMIN_ROLE: TenantRole = "Owner";

function parseSuperAdminEmails(): Set<string> {
  const set = new Set<string>([OWNER_EMAIL]);
  const raw = process.env.SUPER_ADMIN_EMAILS?.trim();
  if (!raw) return set;
  for (const email of raw.split(",")) {
    const normalized = email.trim().toLowerCase();
    if (normalized) set.add(normalized);
  }
  return set;
}

const SUPER_ADMIN_EMAILS = parseSuperAdminEmails();

export function isSuperAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  if (isPlatformOwnerEmail(email)) return true;
  return SUPER_ADMIN_EMAILS.has(email.trim().toLowerCase());
}

export function resolveSuperAdminRole(email: string | undefined | null, currentRole: string): TenantRole {
  return isSuperAdminEmail(email) ? SUPER_ADMIN_ROLE : (currentRole as TenantRole);
}

/** Persist Owner role for configured super-admin emails (idempotent). */
export async function ensureSuperAdminUser(
  userId: string,
  email: string,
  currentRole: string
): Promise<TenantRole> {
  if (!isSuperAdminEmail(email)) {
    return currentRole as TenantRole;
  }

  await UserModel.updateOne(
    { _id: userId },
    {
      $set: {
        role: SUPER_ADMIN_ROLE,
        status: "Active",
        "preferences.isSuperAdmin": true,
      },
    }
  );

  return SUPER_ADMIN_ROLE;
}
