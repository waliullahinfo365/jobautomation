// TODO: Implement using googleapis (drive_v3).
// Reference: https://developers.google.com/drive/api/reference/rest/v3

import type { DriveFile, DriveFolder } from "./drive.types";

export class DriveService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * TODO: Create a sub-folder inside a parent folder.
   */
  async createFolder(_name: string, _parentId: string): Promise<DriveFolder> {
    // TODO: POST /drive/v3/files with mimeType = application/vnd.google-apps.folder
    throw new Error("DriveService.createFolder not implemented");
  }

  /**
   * TODO: Upload a file (PDF, DOCX) to Drive.
   */
  async uploadFile(
    _name: string,
    _mimeType: string,
    _content: Buffer,
    _parentId: string
  ): Promise<DriveFile> {
    // TODO: POST /upload/drive/v3/files
    throw new Error("DriveService.uploadFile not implemented");
  }

  /**
   * TODO: Get a shareable link for a file.
   */
  async getShareableLink(_fileId: string): Promise<string> {
    // TODO: Create a permission then return webViewLink
    throw new Error("DriveService.getShareableLink not implemented");
  }

  /**
   * TODO: List files inside a folder.
   */
  async listFiles(_folderId: string): Promise<DriveFile[]> {
    // TODO: GET /drive/v3/files?q='{folderId}' in parents
    throw new Error("DriveService.listFiles not implemented");
  }

  /**
   * TODO: Delete a file or folder.
   */
  async deleteFile(_fileId: string): Promise<void> {
    // TODO: DELETE /drive/v3/files/{fileId}
    throw new Error("DriveService.deleteFile not implemented");
  }
}
