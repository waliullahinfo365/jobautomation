import { AuditLogModel } from "@jobflow/database/models";
import type { Request } from "express";
import { assertTenantId } from "./baseTenant.service";

type CreateAuditLogInput = {
  tenantId: string;
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  message?: string;
  metadata?: Record<string, unknown>;
  req?: Request;
};

function pickRequestMeta(req?: Request) {
  if (!req) return {};
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.ip;
  return {
    ipAddress: ip,
    userAgent: typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : undefined,
  };
}

export async function createAuditLog(input: CreateAuditLogInput): Promise<void> {
  const { ipAddress, userAgent } = pickRequestMeta(input.req);
  const createdBy = input.userId ?? "system";
  try {
    await AuditLogModel.create({
      tenantId: input.tenantId,
      createdBy,
      userId: input.userId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      message: input.message,
      metadata: input.metadata ?? {},
      ipAddress,
      userAgent,
    });
  } catch (err) {
    console.error("[audit-log] create failed", err);
  }
}

export async function logAuthEvent(
  params: { tenantId: string; userId: string; action: "user.registered" | "user.login" | "user.logout"; message?: string; req?: Request; metadata?: Record<string, unknown> }
): Promise<void> {
  await createAuditLog({
    tenantId: params.tenantId,
    userId: params.userId,
    action: params.action,
    entityType: "User",
    entityId: params.userId,
    message: params.message,
    metadata: params.metadata,
    req: params.req,
  });
}

export async function logSecurityEvent(params: {
  tenantId?: string;
  userId?: string;
  action: string;
  message: string;
  req?: Request;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await createAuditLog({
    tenantId: params.tenantId ?? "unknown",
    userId: params.userId,
    action: params.action,
    message: params.message,
    metadata: params.metadata,
    req: params.req,
  });
}

/** Convenience wrapper when `req.tenantId` is already resolved */
export async function logTenantAudit(req: Request, action: string, opts?: { entityType?: string; entityId?: string; message?: string; metadata?: Record<string, unknown> }) {
  const tenantId = assertTenantId(req.tenantId);
  const userId = req.user?.id;
  await createAuditLog({
    tenantId,
    userId,
    action,
    entityType: opts?.entityType,
    entityId: opts?.entityId,
    message: opts?.message,
    metadata: opts?.metadata,
    req,
  });
}
