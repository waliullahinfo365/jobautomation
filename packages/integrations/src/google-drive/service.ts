export { createJobFolderTreeStub, exportDocumentToPdfStub, routeFileToFolderStub } from "./drive.service";

export const service = {
  connect: async () => ({ connected: false, provider: "google-drive-stub" }),
};
