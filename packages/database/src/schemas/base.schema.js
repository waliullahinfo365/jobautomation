export const baseFields = { tenantId: { type: String, required: true, index: true }, createdBy: { type: String, required: true }, updatedBy: { type: String }, archivedAt: { type: Date, default: null }, deletedAt: { type: Date, default: null } };
export function withBaseFields(schemaDefinition) { return { ...schemaDefinition, ...baseFields }; }
export function applyBaseIndexes(schema, includeStatusIndex = false) { schema.index({ tenantId: 1 }); schema.index({ createdAt: -1 }); if (includeStatusIndex && schema.path("status"))
    schema.index({ tenantId: 1, status: 1 }); }
