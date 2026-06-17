import { DocumentModel } from "@jobflow/database/models";

const MAX_CV_CHARS = 14_000;
const MAX_COVER_LETTER_CHARS = 8_000;
const MAX_PORTFOLIO_CHARS = 6_000;

const workspaceJobFilter = {
  $or: [{ jobId: { $exists: false } }, { jobId: null }, { jobId: "" }],
};

const notAiGenerated = { aiGenerated: { $ne: true } };

function truncate(label: string, text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n\n[${label} truncated for prompt size]`;
}

async function loadLatestText(
  tenantId: string,
  userId: string,
  type: "CV" | "Cover Letter" | "Portfolio",
  profileDocumentType: "cv_resume" | "cover_letter_template" | "supporting_document",
  maxChars: number
): Promise<{ text?: string; documentId?: string; fileName?: string }> {
  const activeBase = { tenantId, profileDocumentType, isActiveProfileDocument: true, ...workspaceJobFilter, ...notAiGenerated };
  const legacyBase = { tenantId, type, ...workspaceJobFilter, ...notAiGenerated };
  let doc: unknown = await DocumentModel.findOne({ ...activeBase, createdBy: userId }).sort({ updatedAt: -1 }).select("_id fileName contentText").lean();
  if (!doc) doc = await DocumentModel.findOne(activeBase).sort({ updatedAt: -1 }).select("_id fileName contentText").lean();
  if (!doc) doc = await DocumentModel.findOne({ ...legacyBase, createdBy: userId }).sort({ updatedAt: -1 }).select("_id fileName contentText").lean();
  if (!doc) doc = await DocumentModel.findOne(legacyBase).sort({ updatedAt: -1 }).select("_id fileName contentText").lean();
  const row = doc as { _id?: unknown; fileName?: string; contentText?: string } | null;
  const raw = typeof row?.contentText === "string" ? row.contentText.trim() : "";
  if (!raw) return {};
  return {
    text: truncate(`${type} excerpt`, raw, maxChars),
    documentId: row?._id ? String(row._id) : undefined,
    fileName: row?.fileName,
  };
}

export type WorkspaceProfileForPrompt = {
  cvText?: string;
  coverLetterStyleText?: string;
  portfolioText?: string;
  cvDocumentId?: string;
  cvFileName?: string;
  coverLetterTemplateDocumentId?: string;
  coverLetterTemplateFileName?: string;
};

export async function loadWorkspaceProfileForPrompt(tenantId: string, userId: string): Promise<WorkspaceProfileForPrompt> {
  try {
    const [cv, coverLetter, portfolio] = await Promise.all([
      loadLatestText(tenantId, userId, "CV", "cv_resume", MAX_CV_CHARS),
      loadLatestText(tenantId, userId, "Cover Letter", "cover_letter_template", MAX_COVER_LETTER_CHARS),
      loadLatestText(tenantId, userId, "Portfolio", "supporting_document", MAX_PORTFOLIO_CHARS),
    ]);
    return {
      cvText: cv.text,
      cvDocumentId: cv.documentId,
      cvFileName: cv.fileName,
      coverLetterStyleText: coverLetter.text,
      coverLetterTemplateDocumentId: coverLetter.documentId,
      coverLetterTemplateFileName: coverLetter.fileName,
      portfolioText: portfolio.text,
    };
  } catch {
    return {};
  }
}

export function formatProfileContextBlock(profile: WorkspaceProfileForPrompt): string {
  const parts: string[] = [];
  if (profile.cvText) {
    parts.push("Candidate CV / resume (authoritative facts — use only this for experience, employers, skills, and metrics):");
    parts.push(profile.cvText);
  }
  if (profile.coverLetterStyleText) {
    parts.push("Reference cover letter (tone, structure, and formality — do not copy employer-specific paragraphs verbatim):");
    parts.push(profile.coverLetterStyleText);
  }
  if (profile.portfolioText) {
    parts.push("Portfolio / work samples context (optional):");
    parts.push(profile.portfolioText);
  }
  if (parts.length === 0) return "";
  return ["---", "Workspace profile documents", ...parts, "---"].join("\n");
}
