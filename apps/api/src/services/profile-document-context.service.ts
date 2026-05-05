import { DocumentModel } from "@jobflow/database/models";

/** Workspace / profile documents: not tied to a specific job. */
const workspaceJobFilter = {
  $or: [{ jobId: { $exists: false } }, { jobId: null }, { jobId: "" }],
};

/** Prefer user-uploaded sources; exclude AI-generated job outputs from profile context. */
const notAiGenerated = { aiGenerated: { $ne: true } };

async function latestWorkspaceDoc(
  tenantId: string,
  userId: string,
  type: "CV" | "Cover Letter"
): Promise<{ contentText?: string } | null> {
  const base = { tenantId, type, ...workspaceJobFilter, ...notAiGenerated };
  let doc: unknown = await DocumentModel.findOne({ ...base, createdBy: userId })
    .sort({ updatedAt: -1 })
    .select("contentText")
    .lean();
  if (!doc) {
    doc = await DocumentModel.findOne(base).sort({ updatedAt: -1 }).select("contentText").lean();
  }
  return doc as { contentText?: string } | null;
}

export async function getProfileDocumentContextFlags(
  tenantId: string,
  userId: string
): Promise<{ hasCvContent: boolean; hasCoverLetterContent: boolean }> {
  const [cv, cl] = await Promise.all([
    latestWorkspaceDoc(tenantId, userId, "CV"),
    latestWorkspaceDoc(tenantId, userId, "Cover Letter"),
  ]);
  const cvText = typeof cv?.contentText === "string" ? cv.contentText.trim() : "";
  const clText = typeof cl?.contentText === "string" ? cl.contentText.trim() : "";
  return {
    hasCvContent: cvText.length > 0,
    hasCoverLetterContent: clText.length > 0,
  };
}
