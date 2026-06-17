export interface AuditLog {
    id: string;
    tenantId: string;
    createdBy: string;
    userId?: string;
    action: string;
    entityType?: string;
    entityId?: string;
    message?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}
