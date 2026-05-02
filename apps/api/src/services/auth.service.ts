import { seedAutomationModules } from "@database/seed/seedAutomationModules";
import { TenantModel, UserModel } from "@database/models";
import type { Tenant } from "@shared/types/tenant";
import type { User, UserStatus } from "@shared/types/user";
import mongoose from "mongoose";
import { env } from "../config/env";
import { signAccessToken } from "../utils/jwt";
import { hashPassword, verifyPassword } from "../utils/password";
import { ApiError } from "../utils/errors";
import { logAuthEvent } from "./audit-log.service";

const freeTrialLimits = {
  maxJobs: 25,
  maxAutomationRuns: 100,
  maxAiCredits: 50,
  maxUsers: 5,
  maxStorageMb: 100,
  maxIntegrations: 2,
  maxReportsPerMonth: 10,
};

function requireJwtForAuth(): void {
  if (!env.jwtSecret) {
    throw new ApiError("Authentication is not configured (JWT_SECRET)", 500, "CONFIG_ERROR");
  }
}

function slugifyWorkspace(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return (base || "workspace").slice(0, 80);
}

async function uniqueSlug(base: string): Promise<string> {
  let candidate = base;
  let n = 2;
  while (await TenantModel.exists({ slug: candidate })) {
    candidate = `${base}-${n}`;
    n += 1;
  }
  return candidate;
}

function toPublicUser(doc: Record<string, unknown>): Omit<User, "passwordHash"> {
  return {
    id: String(doc._id ?? doc.id),
    tenantId: String(doc.tenantId),
    name: String(doc.name),
    email: String(doc.email),
    role: doc.role as User["role"],
    status: doc.status as User["status"],
    avatarUrl: doc.avatarUrl as string | undefined,
    timezone: doc.timezone as string | undefined,
    lastLoginAt: doc.lastLoginAt ? new Date(doc.lastLoginAt as string | Date).toISOString() : undefined,
    emailVerifiedAt: doc.emailVerifiedAt
      ? new Date(doc.emailVerifiedAt as string | Date).toISOString()
      : undefined,
    preferences: (doc.preferences as Record<string, unknown>) ?? {},
    createdAt: new Date(doc.createdAt as string | Date).toISOString(),
    updatedAt: new Date(doc.updatedAt as string | Date).toISOString(),
  };
}

function toPublicTenant(doc: Record<string, unknown>): Tenant {
  return {
    id: String(doc._id ?? doc.id),
    name: String(doc.name),
    slug: String(doc.slug),
    ownerId: String(doc.ownerId),
    plan: doc.plan as Tenant["plan"],
    status: doc.status as Tenant["status"],
    billingStatus: doc.billingStatus as Tenant["billingStatus"],
    trialEndsAt: doc.trialEndsAt ? new Date(doc.trialEndsAt as string | Date).toISOString() : undefined,
    stripeCustomerId: doc.stripeCustomerId as string | undefined,
    stripeSubscriptionId: doc.stripeSubscriptionId as string | undefined,
    settings: (doc.settings as Record<string, unknown>) ?? {},
    limits: doc.limits as Tenant["limits"],
    usage: doc.usage as Tenant["usage"],
    createdAt: new Date(doc.createdAt as string | Date).toISOString(),
    updatedAt: new Date(doc.updatedAt as string | Date).toISOString(),
  };
}

export const authService = {
  async registerUser(input: {
    name: string;
    email: string;
    password: string;
    workspaceName: string;
    req?: import("express").Request;
  }) {
    requireJwtForAuth();
    const email = input.email.trim().toLowerCase();
    const dup = await UserModel.exists({ email });
    if (dup) {
      throw new ApiError("An account with this email already exists", 409, "EMAIL_IN_USE");
    }

    const passwordHash = await hashPassword(input.password);
    const userId = new mongoose.Types.ObjectId();
    const tenantId = new mongoose.Types.ObjectId();
    const slugBase = slugifyWorkspace(input.workspaceName);
    const slug = await uniqueSlug(slugBase);

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await TenantModel.create(
        [
          {
            _id: tenantId,
            name: input.workspaceName.trim(),
            slug,
            ownerId: userId.toString(),
            plan: "Free Trial",
            status: "Trialing",
            billingStatus: "Trialing",
            billing: {
              planKey: "free_trial",
              billingStatus: "Trialing",
              cancelAtPeriodEnd: false,
            },
            limits: freeTrialLimits,
            usage: {
              jobsCount: 0,
              automationRunsThisMonth: 0,
              aiCreditsUsedThisMonth: 0,
              documentsCount: 0,
              storageUsedMb: 0,
              usersCount: 1,
              integrationsCount: 0,
              reportsGeneratedThisMonth: 0,
            },
          },
        ],
        { session }
      );

      await UserModel.create(
        [
          {
            _id: userId,
            tenantId: tenantId.toString(),
            createdBy: userId.toString(),
            name: input.name.trim(),
            email,
            passwordHash,
            role: "Owner",
            status: "Active" as UserStatus,
          },
        ],
        { session }
      );

      await session.commitTransaction();
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }

    await seedAutomationModules(tenantId.toString(), userId.toString());

    const userDoc = await UserModel.findById(userId).lean();
    const tenantDoc = await TenantModel.findById(tenantId).lean();
    if (!userDoc || !tenantDoc) {
      throw new ApiError("Registration failed to persist", 500, "REGISTER_FAILED");
    }

    const user = toPublicUser(userDoc as Record<string, unknown>);
    const tenant = toPublicTenant(tenantDoc as Record<string, unknown>);

    const accessToken = signAccessToken({
      userId: user.id,
      tenantId: tenant.id,
      role: user.role,
      email: user.email,
    });

    await logAuthEvent({
      tenantId: tenant.id,
      userId: user.id,
      action: "user.registered",
      message: "User registered",
      req: input.req,
      metadata: { email: user.email },
    });

    return { user, tenant, accessToken };
  },

  async loginUser(input: { email: string; password: string; req?: import("express").Request }) {
    requireJwtForAuth();
    const email = input.email.trim().toLowerCase();
    const userDoc = await UserModel.findOne({ email }).lean();
    if (!userDoc) {
      throw new ApiError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }
    const row = userDoc as Record<string, unknown>;
    const ok = await verifyPassword(input.password, String(row.passwordHash ?? ""));
    if (!ok) {
      throw new ApiError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }
    if (row.status !== "Active") {
      throw new ApiError("Account is not active", 403, "USER_INACTIVE");
    }

    const tenantDoc = await TenantModel.findById(String(row.tenantId)).lean();
    if (!tenantDoc) {
      throw new ApiError("Workspace not found", 404, "TENANT_NOT_FOUND");
    }

    await UserModel.updateOne({ _id: row._id }, { $set: { lastLoginAt: new Date() } });

    const user = toPublicUser(row);
    const tenant = toPublicTenant(tenantDoc as Record<string, unknown>);

    const accessToken = signAccessToken({
      userId: user.id,
      tenantId: tenant.id,
      role: user.role,
      email: user.email,
    });

    await logAuthEvent({
      tenantId: tenant.id,
      userId: user.id,
      action: "user.login",
      message: "User login",
      req: input.req,
    });

    return { user, tenant, accessToken };
  },

  async getCurrentUser(params: { userId: string; tenantId: string }) {
    const userDoc = await UserModel.findOne({ _id: params.userId, tenantId: params.tenantId }).lean();
    if (!userDoc) {
      throw new ApiError("User not found", 404, "NOT_FOUND");
    }
    const tenantDoc = await TenantModel.findById(params.tenantId).lean();
    if (!tenantDoc) {
      throw new ApiError("Workspace not found", 404, "NOT_FOUND");
    }
    return {
      user: toPublicUser(userDoc as Record<string, unknown>),
      tenant: toPublicTenant(tenantDoc as Record<string, unknown>),
    };
  },

  async logoutUser() {
    return { ok: true as const };
  },
};
