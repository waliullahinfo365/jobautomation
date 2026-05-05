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
  maxChars: number
): Promise<string | undefined> {
  const base = { tenantId, type, ...workspaceJobFilter, ...notAiGenerated };
  let doc: unknown = await DocumentModel.findOne({ ...base, createdBy: userId }).sort({ updatedAt: -1 }).select("contentText").lean();
  if (!doc) {
    doc = await DocumentModel.findOne(base).sort({ updatedAt: -1 }).select("contentText").lean();
  }
  const row = doc as { contentText?: string } | null;
  const raw = typeof row?.contentText === "string" ? row.contentText.trim() : "";
  if (!raw) return undefined;
  return truncate(`${type} excerpt`, raw, maxChars);
}

export type WorkspaceProfileForPrompt = {
  cvText?: string;
  coverLetterStyleText?: string;
  portfolioText?: string;
};

export async function loadWorkspaceProfileForPrompt(tenantId: string, userId: string): Promise<WorkspaceProfileForPrompt> {
  try {
    const [cvText, coverLetterStyleText, portfolioText] = await Promise.all([
      loadLatestText(tenantId, userId, "CV", MAX_CV_CHARS),
      loadLatestText(tenantId, userId, "Cover Letter", MAX_COVER_LETTER_CHARS),
      loadLatestText(tenantId, userId, "Portfolio", MAX_PORTFOLIO_CHARS),
    ]);
    return { cvText, coverLetterStyleText, portfolioText };
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
