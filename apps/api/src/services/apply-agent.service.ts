import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { JobModel, IntegrationConnectionModel, UserModel } from "@jobflow/database/models";
import type { UserProfile } from "@jobflow/integrations/playwright";
import { documentApplicationEvent } from "@jobflow/database";
import { ApiError } from "../utils/errors";
import { assertTenantId } from "./baseTenant.service";

const AGENT_PROVIDER = "apply-agent-device";
const PAIRING_PROVIDER = "apply-agent-pairing";
const PAIRING_TTL_MS = 10 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generatePairingCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateAgentToken(): string {
  return `njg_agent_${randomBytes(32).toString("hex")}`;
}

function extractName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  const firstName = parts[0] ?? name;
  const lastName = parts.slice(1).join(" ") || "";
  return { firstName, lastName };
}

/** Applicant profile for desktop agent form filling. */
export async function getAgentApplyProfile(tenantId: string): Promise<UserProfile> {
  const user = await UserModel.findOne({ tenantId, role: { $in: ["Owner", "Admin"] } }).lean();
  if (!user) throw new ApiError("No workspace user found for apply profile", 404, "NOT_FOUND");

  const u = user as Record<string, unknown>;
  const name = String(u.name ?? "Unknown User");
  const { firstName, lastName } = extractName(name);
  const prefs = (u.preferences as Record<string, unknown>) ?? {};

  return {
    firstName,
    lastName,
    email: String(u.email ?? ""),
    phone: String(prefs.phone ?? ""),
    location: String(prefs.location ?? ""),
    linkedinUrl: String(prefs.linkedinUrl ?? ""),
    websiteUrl: String(prefs.websiteUrl ?? ""),
    yearsExperience: typeof prefs.yearsExperience === "number" ? prefs.yearsExperience : undefined,
    currentTitle: String(prefs.currentTitle ?? ""),
    desiredSalary: String(prefs.desiredSalary ?? "Negotiable"),
    noticePeriod: String(prefs.noticePeriod ?? ""),
    rightToWork: typeof prefs.rightToWork === "boolean" ? prefs.rightToWork : true,
    requiresSponsorship: typeof prefs.requiresSponsorship === "boolean" ? prefs.requiresSponsorship : false,
  };
}

/** Create a 6-digit pairing code for desktop agent setup. */
export async function createAgentPairingCode(input: { tenantId: string; userId: string; deviceName?: string }) {
  const tenantId = assertTenantId(input.tenantId);
  const code = generatePairingCode();
  const expiresAt = new Date(Date.now() + PAIRING_TTL_MS);

  await IntegrationConnectionModel.findOneAndUpdate(
    { tenantId, provider: PAIRING_PROVIDER },
    {
      tenantId,
      provider: PAIRING_PROVIDER,
      status: "Connected",
      metadata: {
        codeHash: hashToken(code),
        expiresAt: expiresAt.toISOString(),
        deviceName: input.deviceName?.trim() || "Desktop Apply Agent",
        createdBy: input.userId,
      },
      updatedBy: input.userId,
      createdBy: input.userId,
    },
    { upsert: true, new: true }
  );

  return { code, expiresAt: expiresAt.toISOString() };
}

/** Exchange pairing code for a long-lived agent bearer token. */
export async function exchangeAgentPairingCode(input: {
  code: string;
  deviceName?: string;
  agentVersion?: string;
}) {
  const code = input.code.trim();
  if (!/^\d{6}$/.test(code)) throw new ApiError("Invalid pairing code", 422, "VALIDATION_ERROR");

  const row = await IntegrationConnectionModel.findOne({ provider: PAIRING_PROVIDER, status: "Connected" }).lean() as
    | Record<string, unknown>
    | null;
  if (!row) throw new ApiError("No active pairing code — generate one in Settings", 404, "NOT_FOUND");

  const meta = (row.metadata as Record<string, unknown>) ?? {};
  const storedHash = String(meta.codeHash ?? "");
  const expiresAt = meta.expiresAt ? new Date(String(meta.expiresAt)) : null;
  if (!expiresAt || expiresAt.getTime() < Date.now()) {
    throw new ApiError("Pairing code expired — generate a new one in Settings", 410, "EXPIRED");
  }

  const codeHash = hashToken(code);
  const a = Buffer.from(storedHash, "utf8");
  const b = Buffer.from(codeHash, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new ApiError("Invalid pairing code", 401, "INVALID_CODE");
  }

  const tenantId = String(row.tenantId);
  const token = generateAgentToken();
  const tokenHash = hashToken(token);
  const deviceName = input.deviceName?.trim() || String(meta.deviceName ?? "Desktop Apply Agent");

  await IntegrationConnectionModel.findOneAndUpdate(
    { tenantId, provider: AGENT_PROVIDER },
    {
      tenantId,
      provider: AGENT_PROVIDER,
      status: "Connected",
      accountName: deviceName,
      metadata: {
        tokenHash,
        agentVersion: input.agentVersion ?? "unknown",
        pairedAt: new Date().toISOString(),
        lastHeartbeat: new Date().toISOString(),
      },
      updatedBy: "apply-agent",
      createdBy: "apply-agent",
    },
    { upsert: true, new: true }
  );

  await IntegrationConnectionModel.deleteOne({ tenantId, provider: PAIRING_PROVIDER });

  return { token, tenantId, deviceName };
}

export async function resolveAgentTenantFromToken(bearerToken: string): Promise<string | null> {
  const token = bearerToken.replace(/^Bearer\s+/i, "").trim();
  if (!token.startsWith("njg_agent_")) return null;
  const tokenHash = hashToken(token);

  const row = await IntegrationConnectionModel.findOne({
    provider: AGENT_PROVIDER,
    status: "Connected",
    "metadata.tokenHash": tokenHash,
  }).lean() as Record<string, unknown> | null;

  return row ? String(row.tenantId) : null;
}

export async function recordAgentHeartbeat(input: {
  tenantId: string;
  agentVersion?: string;
  linkedInConnected?: boolean;
}) {
  await IntegrationConnectionModel.updateOne(
    { tenantId: input.tenantId, provider: AGENT_PROVIDER },
    {
      $set: {
        "metadata.lastHeartbeat": new Date().toISOString(),
        "metadata.agentVersion": input.agentVersion ?? "unknown",
        "metadata.linkedInConnected": input.linkedInConnected ?? false,
        syncStatus: "OK",
      },
    }
  );
}

export async function getAgentApplyQueue(tenantId: string) {
  const jobs = await JobModel.find({
    tenantId,
    status: "Ready to Apply",
    jobUrl: { $exists: true, $ne: "" },
  })
    .select("_id jobUrl company position title generatedCoverLetterLink")
    .sort({ lastUpdated: -1 })
    .limit(10)
    .lean();

  return jobs.map((j) => {
    const row = j as Record<string, unknown>;
    return {
      jobId: String(row._id),
      jobUrl: String(row.jobUrl ?? ""),
      company: String(row.company ?? ""),
      position: String(row.position ?? row.title ?? ""),
      coverLetterUrl: String(row.generatedCoverLetterLink ?? ""),
    };
  });
}

export async function submitAgentApplyResult(input: {
  tenantId: string;
  userId?: string;
  jobId: string;
  success: boolean;
  message: string;
  stepsCompleted?: number;
}) {
  if (input.success) {
    await documentApplicationEvent({
      tenantId: input.tenantId,
      userId: input.userId ?? "apply-agent",
      jobId: input.jobId,
      applicationStatus: "Applied",
      applyMethod: "linkedin_auto",
      appliedAt: new Date(),
    });
  } else {
    await JobModel.findByIdAndUpdate(input.jobId, {
      status: "Ready to Apply",
      lastUpdated: new Date(),
    });
  }

  return { recorded: true, stepsCompleted: input.stepsCompleted ?? 0 };
}

export async function getAgentStatus(tenantId: string) {
  const row = await IntegrationConnectionModel.findOne({
    tenantId,
    provider: AGENT_PROVIDER,
    status: "Connected",
  }).lean() as Record<string, unknown> | null;

  if (!row) return { connected: false as const };

  const meta = (row.metadata as Record<string, unknown>) ?? {};
  return {
    connected: true as const,
    deviceName: String(row.accountName ?? "Desktop Apply Agent"),
    lastHeartbeat: meta.lastHeartbeat ?? null,
    agentVersion: meta.agentVersion ?? null,
    linkedInConnected: meta.linkedInConnected === true,
  };
}
