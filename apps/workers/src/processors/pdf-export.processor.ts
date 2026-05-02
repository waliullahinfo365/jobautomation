export type PdfExportPayload = {
  tenantId: string;
  documentId: string;
  userId: string;
  operationId?: string;
};

export async function processPdfExportJob(payload: PdfExportPayload) {
  // TODO: Replace with BullMQ/Redis queue processor and API transport.
  return {
    queued: true,
    moduleKey: "pdf-export",
    operationId: payload.operationId ?? `pdf-export-${Date.now()}`,
    payload,
  };
}
