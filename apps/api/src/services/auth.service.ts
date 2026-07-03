import crypto from "node:crypto";
import { seedAutomationModules } from "@jobflow/database/seed/seedAutomationModules";
import { TenantModel, UserModel } from "@jobflow/database/models";
import type { Tenant } from "@jobflow/shared/types/tenant";
import type { User, UserStatus } from "@jobflow/shared/types/user";
import { resolveProductRole } from "@jobflow/shared/constants/product-roles";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { GOOGLE_CLIENT_ID, GOOGLE_OAUTH_ENABLED } from "../config/google-oauth";
import { signAccessToken } from "../utils/jwt";
import { hashPassword, verifyPassword } from "../utils/password";
import { ApiError } from "../utils/errors";
import { logAuthEvent } from "./audit-log.service";
import { ensureSuperAdminUser, isSuperAdminEmail, resolveSuperAdminRole } from "./super-admin.service";

// ─── Password reset token store (in-memory, single process) ─────────────────
// For multi-instance deployments, replace with a DB-backed token model.
const passwordResetTokens = new Map<string, { email: string; expiresAt: number }>();

export async function requestPasswordReset(email: string): Promise<void> {
  const normalised = email.trim().toLowerCase();
  // Always respond the same way — don't leak whether email exists
  const exists = await UserModel.exists({ email: normalised });
  if (!exists) return;

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
  passwordResetTokens.set(token, { email: normalised, expiresAt });

  const frontendUrl = (process.env.FRONTEND_URL ?? process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

  // Log link for environments without an email service configured
  // Replace this block with your email provider (Resend, SendGrid, etc.)
  console.info(`[auth] Password reset link for ${normalised}: ${resetUrl}`);
}

export async function confirmPasswordReset(token: string, newPassword: string): Promise<void> {
  const entry = passwordResetTokens.get(token);
  if (!entry || entry.expiresAt < Date.now()) {
    throw new ApiError("Reset token is invalid or expired", 400, "INVALID_RESET_TOKEN");
  }
  passwordResetTokens.delete(token);

  const userDoc = await UserModel.findOne({ email: entry.email }).lean();
  if (!userDoc) throw new ApiError("User not found", 404, "NOT_FOUND");

  const passwordHash = await hashPassword(newPassword);
  await UserModel.updateOne({ _id: (userDoc as Record<string, unknown>)._id }, { $set: { passwordHash } });
}

// ─── Google login OAuth state ────────────────────────────────────────────────

const GOOGLE_LOGIN_STATE_TYP = "google_login_state";
const GOOGLE_LOGIN_SCOPES = ["openid", "email", "profile"];

function getStateSecret(): string {
  if (env.jwtSecret) return env.jwtSecret;
  if (env.nodeEnv !== "production") return "jobflow-google-login-state-dev-insecure";
  throw new ApiError("JWT_SECRET is required for Google login", 500, "CONFIG_ERROR");
}

export function createGoogleLoginState(): string {
  const nonce = crypto.randomBytes(16).toString("hex");
  return jwt.sign({ typ: GOOGLE_LOGIN_STATE_TYP, nonce, ts: Date.now() }, getStateSecret(), { expiresIn: 600 });
}

export function verifyGoogleLoginState(state: string): void {
  try {
    const d = jwt.verify(state, getStateSecret()) as Record<string, unknown>;
    if (d.typ !== GOOGLE_LOGIN_STATE_TYP) throw new Error("bad state type");
  } catch (e) {
    throw new ApiError(e instanceof Error ? e.message : "Invalid Google login state", 400, "OAUTH_STATE_INVALID");
  }
}

function googleLoginRedirectUri(): string {
  const explicit = process.env.GOOGLE_AUTH_REDIRECT_URI?.trim();
  if (explicit) return explicit;
  const base = (process.env.API_PUBLIC_URL ?? "").replace(/\/$/, "") || `http://localhost:${env.port}`;
  return `${base}/auth/google/callback`;
}

export function getGoogleLoginAuthorizationUrl(): { authorizationUrl: string | null; oauthEnabled: boolean; message?: string } {
  if (!GOOGLE_OAUTH_ENABLED) {
    return {
      authorizationUrl: null,
      oauthEnabled: false,
      message: "Google sign-in is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and API_PUBLIC_URL.",
    };
  }
  const state = createGoogleLoginState();
  const redirectUri = googleLoginRedirectUri();
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", GOOGLE_LOGIN_SCOPES.join(" "));
  u.searchParams.set("state", state);
  u.searchParams.set("access_type", "offline");
  u.searchParams.set("prompt", "select_account");
  return { authorizationUrl: u.toString(), oauthEnabled: true };
}

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
  const email = String(doc.email);
  const role = resolveSuperAdminRole(email, String(doc.role));
  const preferences = (doc.preferences as Record<string, unknown>) ?? {};
  const productRole = resolveProductRole({
    tenantRole: role,
    isSuperAdmin: isSuperAdminEmail(email) || preferences.isSuperAdmin === true,
    email,
  });
  return {
    id: String(doc._id ?? doc.id),
    tenantId: String(doc.tenantId),
    name: String(doc.name),
    email,
    role,
    productRole,
    status: doc.status as User["status"],
    avatarUrl: doc.avatarUrl as string | undefined,
    timezone: doc.timezone as string | undefined,
    lastLoginAt: doc.lastLoginAt ? new Date(doc.lastLoginAt as string | Date).toISOString() : undefined,
    emailVerifiedAt: doc.emailVerifiedAt
      ? new Date(doc.emailVerifiedAt as string | Date).toISOString()
      : undefined,
    preferences,
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
              planKey: "free",
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

    await ensureSuperAdminUser(userId.toString(), email, "Member");
    const freshUserDoc = (await UserModel.findById(userId).lean()) ?? userDoc;

    const user = toPublicUser(freshUserDoc as Record<string, unknown>);
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

    await ensureSuperAdminUser(String(row._id), email, String(row.role ?? "Member"));
    const freshUserDoc = (await UserModel.findById(row._id).lean()) ?? row;
    const user = toPublicUser(freshUserDoc as Record<string, unknown>);
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

  async updateCurrentUserProfile(input: { userId: string; tenantId: string; name: string }) {
    const name = input.name.trim();
    if (!name) throw new ApiError("Name is required", 422, "VALIDATION_ERROR");
    const userDoc = await UserModel.findOneAndUpdate(
      { _id: input.userId, tenantId: input.tenantId },
      { $set: { name } },
      { new: true }
    ).lean();
    if (!userDoc) throw new ApiError("User not found", 404, "NOT_FOUND");
    return toPublicUser(userDoc as Record<string, unknown>);
  },

  async changePassword(input: {
    userId: string;
    tenantId: string;
    currentPassword: string;
    newPassword: string;
  }) {
    const userDoc = await UserModel.findOne({ _id: input.userId, tenantId: input.tenantId }).lean();
    if (!userDoc) throw new ApiError("User not found", 404, "NOT_FOUND");
    const passwordHash = String((userDoc as Record<string, unknown>).passwordHash ?? "");
    if (!passwordHash) {
      throw new ApiError(
        "Password change is not available for accounts signed in with Google",
        400,
        "PASSWORD_NOT_SET"
      );
    }
    const valid = await verifyPassword(input.currentPassword, passwordHash);
    if (!valid) throw new ApiError("Current password is incorrect", 401, "INVALID_PASSWORD");
    const nextHash = await hashPassword(input.newPassword);
    await UserModel.updateOne({ _id: input.userId }, { $set: { passwordHash: nextHash } });
    return { ok: true as const };
  },

  async logoutUser() {
    return { ok: true as const };
  },

  async loginWithGoogle(input: { code: string; state: string; req?: import("express").Request }) {
    requireJwtForAuth();
    verifyGoogleLoginState(input.state);

    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
    if (!GOOGLE_OAUTH_ENABLED || !clientSecret) {
      throw new ApiError("Google sign-in is not configured", 503, "GOOGLE_OAUTH_DISABLED");
    }

    const redirectUri = googleLoginRedirectUri();
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: input.code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });
    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      throw new ApiError(`Google token exchange failed: ${text.slice(0, 200)}`, 502, "GOOGLE_TOKEN_EXCHANGE_FAILED");
    }
    const tokens = (await tokenRes.json()) as { access_token: string; refresh_token?: string };

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { authorization: `Bearer ${tokens.access_token}` },
    });
    if (!profileRes.ok) throw new ApiError("Google userinfo failed", 502, "GOOGLE_USERINFO_FAILED");
    const profile = (await profileRes.json()) as { email?: string; name?: string };
    if (!profile.email) throw new ApiError("Google did not return an email", 502, "GOOGLE_NO_EMAIL");

    const email = profile.email.trim().toLowerCase();
    const existingUser = await UserModel.findOne({ email }).lean() as Record<string, unknown> | null;

    let userId: string;
    let tenantId: string;

    if (existingUser) {
      if (existingUser.status !== "Active") {
        throw new ApiError("Account is not active", 403, "USER_INACTIVE");
      }
      userId = String(existingUser._id);
      tenantId = String(existingUser.tenantId);
      await UserModel.updateOne({ _id: existingUser._id }, { $set: { lastLoginAt: new Date() } });
      await ensureSuperAdminUser(userId, email, String(existingUser.role ?? "Member"));
    } else {
      // First Google login — create user + tenant
      const newUserId = new mongoose.Types.ObjectId();
      const newTenantId = new mongoose.Types.ObjectId();
      const name = (profile.name ?? email.split("@")[0]).trim();
      const slugBase = slugifyWorkspace(name + " workspace");
      const slug = await uniqueSlug(slugBase);

      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        await TenantModel.create([{
          _id: newTenantId,
          name: `${name}'s Workspace`,
          slug,
          ownerId: newUserId.toString(),
          plan: "Free Trial",
          status: "Trialing",
          billingStatus: "Trialing",
          billing: { planKey: "free", billingStatus: "Trialing", cancelAtPeriodEnd: false },
          limits: freeTrialLimits,
          usage: { jobsCount: 0, automationRunsThisMonth: 0, aiCreditsUsedThisMonth: 0, documentsCount: 0, storageUsedMb: 0, usersCount: 1, integrationsCount: 0, reportsGeneratedThisMonth: 0 },
        }], { session });
        await UserModel.create([{
          _id: newUserId,
          tenantId: newTenantId.toString(),
          createdBy: newUserId.toString(),
          name,
          email,
          passwordHash: "",
          role: "Owner",
          status: "Active" as UserStatus,
          lastLoginAt: new Date(),
        }], { session });
        await session.commitTransaction();
      } catch (e) {
        await session.abortTransaction();
        throw e;
      } finally {
        session.endSession();
      }
      await seedAutomationModules(newTenantId.toString(), newUserId.toString());
      userId = newUserId.toString();
      tenantId = newTenantId.toString();
      await ensureSuperAdminUser(userId, email, "Member");
    }

    const userDoc = (await UserModel.findById(userId).lean()) as Record<string, unknown> | null;
    const tenantDoc = await TenantModel.findById(tenantId).lean() as Record<string, unknown>;
    if (!userDoc || !tenantDoc) throw new ApiError("Login failed to load session", 500, "LOGIN_FAILED");

    const user = toPublicUser(userDoc);
    const tenant = toPublicTenant(tenantDoc);
    const accessToken = signAccessToken({ userId: user.id, tenantId: tenant.id, role: user.role, email: user.email });

    await logAuthEvent({ tenantId: tenant.id, userId: user.id, action: "user.login", message: "Google login", req: input.req });

    return { user, tenant, accessToken };
  },
};
