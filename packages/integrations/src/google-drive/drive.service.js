function slugify(value) {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function deterministicId(prefix, parts) {
    return `${prefix}-${parts.map(slugify).filter(Boolean).join("-")}`;
}
export async function createJobFolderTreeStub(input) {
    const rootFolderId = deterministicId("drv-root", [input.tenantId]);
    const jobFolderId = deterministicId("drv-job", [input.tenantId, input.jobId, input.company, input.position]);
    const folderNames = ["CV", "Cover Letters", "Research", "Exports"];
    return {
        rootFolderId,
        jobFolderId,
        jobFolderUrl: `https://drive.stub.local/folders/${jobFolderId}`,
        foldersCreated: folderNames.map((name) => ({
            id: deterministicId("drv-sub", [jobFolderId, name]),
            name,
            url: `https://drive.stub.local/folders/${deterministicId("drv-sub", [jobFolderId, name])}`,
        })),
    };
}
export async function routeFileToFolderStub(input) {
    const sourceFileId = input.sourceFileId ?? deterministicId("drv-src", [input.tenantId, input.documentId, input.fileName]);
    const targetFileId = deterministicId("drv-file", [sourceFileId, input.targetFolderId]);
    const targetPath = `${input.targetFolderId}/${slugify(input.fileName) || "file"}`;
    return {
        targetFileId,
        targetPath,
        targetFolderId: input.targetFolderId,
        routedAt: new Date().toISOString(),
    };
}
export async function exportDocumentToPdfStub(input) {
    const pdfFileId = deterministicId("drv-pdf", [input.tenantId, input.documentId, input.fileName]);
    return {
        pdfFileId,
        pdfUrl: `https://drive.stub.local/files/${pdfFileId}.pdf`,
        exportedAt: new Date().toISOString(),
    };
}
