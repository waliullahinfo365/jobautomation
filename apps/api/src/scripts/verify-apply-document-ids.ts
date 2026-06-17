/**
 * Verifies completeApplyAssistant persists resolved CV + cover letter documentIds.
 *
 * Usage:
 *   dotenv -e ../../.env -- tsx src/scripts/verify-apply-document-ids.ts <tenantId> <userId> <jobId>
 */
import { connectDatabase } from "@jobflow/database";
import { ApplicationModel, DocumentModel } from "@jobflow/database/models";
import { completeApplyAssistant } from "../services/apply-assistant.service";

const tenantId = process.argv[2];
const userId = process.argv[3];
const jobId = process.argv[4];

if (!tenantId || !userId || !jobId) {
  console.error("Usage: tsx verify-apply-document-ids.ts <tenantId> <userId> <jobId>");
  process.exit(1);
}

async function main() {
  await connectDatabase();

  const cv = await DocumentModel.findOneAndUpdate(
    { tenantId, profileDocumentType: "cv_resume", fileName: "verify-cv.pdf" },
    {
      tenantId,
      createdBy: userId,
      fileName: "verify-cv.pdf",
      type: "cv_resume",
      status: "Ready",
      profileDocumentType: "cv_resume",
      isActiveProfileDocument: true,
      googleDriveFileId: "verify-fake-cv-drive-id",
      contentText: "Senior engineer with 8 years experience in TypeScript and distributed systems.",
    },
    { upsert: true, new: true }
  );
  const cl = await DocumentModel.findOneAndUpdate(
    { tenantId, profileDocumentType: "cover_letter_template", fileName: "verify-cl.pdf" },
    {
      tenantId,
      createdBy: userId,
      fileName: "verify-cl.pdf",
      type: "cover_letter_template",
      status: "Ready",
      profileDocumentType: "cover_letter_template",
      isActiveProfileDocument: true,
      googleDriveFileId: "verify-fake-cl-drive-id",
      contentText: "Dear hiring manager, I am excited to apply...",
    },
    { upsert: true, new: true }
  );

  await ApplicationModel.deleteMany({ tenantId, jobId });
  const app = await completeApplyAssistant({
    tenantId,
    userId,
    jobId,
    status: "Applied",
    notes: "documentIds verification",
  });
  const row = (await ApplicationModel.findById(app._id).lean()) as { documentIds?: string[] } | null;
  const ids = row?.documentIds ?? [];
  if (!ids.length) throw new Error("documentIds is empty after complete");
  for (const expected of [String(cv._id), String(cl._id)]) {
    if (!ids.includes(expected)) throw new Error(`documentIds missing ${expected}, got ${ids.join(",")}`);
  }
  console.log(`✓ documentIds persisted: ${ids.join(", ")}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
