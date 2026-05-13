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
  type: "CV" | "Cover Letter",
  profileDocumentType: "cv_resume" | "cover_letter_template"
): Promise<{ contentText?: string } | null> {
  const activeBase = { tenantId, profileDocumentType, isActiveProfileDocument: true, ...workspaceJobFilter, ...notAiGenerated };
  const legacyBase = { tenantId, type, ...workspaceJobFilter, ...notAiGenerated };
  let doc: unknown = await DocumentModel.findOne({ ...activeBase, createdBy: userId })
    .sort({ updatedAt: -1 })
    .select("contentText")
    .lean();
  if (!doc) {
    doc = await DocumentModel.findOne(activeBase).sort({ updatedAt: -1 }).select("contentText").lean();
  }
  if (!doc) {
    doc = await DocumentModel.findOne({ ...legacyBase, createdBy: userId }).sort({ updatedAt: -1 }).select("contentText").lean();
  }
  if (!doc) {
    doc = await DocumentModel.findOne(legacyBase).sort({ updatedAt: -1 }).select("contentText").lean();
  }
  return doc as { contentText?: string } | null;
}

export async function getProfileDocumentContextFlags(
  tenantId: string,
  userId: string
): Promise<{ hasCvContent: boolean; hasCoverLetterContent: boolean }> {
  const [cv, cl] = await Promise.all([
    latestWorkspaceDoc(tenantId, userId, "CV", "cv_resume"),
    latestWorkspaceDoc(tenantId, userId, "Cover Letter", "cover_letter_template"),
  ]);
  const cvText = typeof cv?.contentText === "string" ? cv.contentText.trim() : "";
  const clText = typeof cl?.contentText === "string" ? cl.contentText.trim() : "";
  return {
    hasCvContent: cvText.length > 0,
    hasCoverLetterContent: clText.length > 0,
  };
}
