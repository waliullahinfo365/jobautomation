import { IntegrationConnectionModel } from "@jobflow/database/models";
import { googleApiJson } from "./google-auth";

function escapeDriveQuery(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

type DriveFile = { id: string; name?: string; webViewLink?: string; parents?: string[] };

export async function findFolderByName(input: {
  accessToken: string;
  name: string;
  parentId?: string;
}): Promise<DriveFile | null> {
  const parts = [
    "trashed=false",
    "mimeType='application/vnd.google-apps.folder'",
    `name='${escapeDriveQuery(input.name)}'`,
  ];
  if (input.parentId) parts.push(`'${escapeDriveQuery(input.parentId)}' in parents`);
  const q = parts.join(" and ");
  const result = await googleApiJson<{ files?: DriveFile[] }>({
    url: `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&pageSize=1&fields=files(id,name,webViewLink,parents)`,
    accessToken: input.accessToken,
  });
  return result.files?.[0] ?? null;
}

export async function createFolder(input: {
  accessToken: string;
  name: string;
  parentId?: string;
}): Promise<DriveFile> {
  return googleApiJson<DriveFile>({
    url: "https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink,parents",
    method: "POST",
    accessToken: input.accessToken,
    body: {
      name: input.name,
      mimeType: "application/vnd.google-apps.folder",
      ...(input.parentId ? { parents: [input.parentId] } : {}),
    },
  });
}

export async function findOrCreateFolder(input: {
  accessToken: string;
  name: string;
  parentId?: string;
}): Promise<{ folder: DriveFile; created: boolean }> {
  const existing = await findFolderByName(input);
  if (existing) return { folder: existing, created: false };
  const created = await createFolder(input);
  return { folder: created, created: true };
}

export async function createGoogleDoc(input: {
  accessToken: string;
  name: string;
  content: string;
  parentId?: string;
}): Promise<{ id: string; webViewLink?: string }> {
  const created = await googleApiJson<{ id: string; webViewLink?: string }>({
    url: "https://www.googleapis.com/drive/v3/files?fields=id,webViewLink",
    method: "POST",
    accessToken: input.accessToken,
    body: {
      name: input.name,
      mimeType: "application/vnd.google-apps.document",
      ...(input.parentId ? { parents: [input.parentId] } : {}),
    },
  });
  if (input.content.trim().length > 0) {
    await googleApiJson({
      url: `https://docs.googleapis.com/v1/documents/${created.id}:batchUpdate`,
      method: "POST",
      accessToken: input.accessToken,
      body: {
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: input.content,
            },
          },
        ],
      },
    });
  }
  return created;
}

export async function moveOrCopyFileToFolder(input: {
  accessToken: string;
  fileId: string;
  parentId: string;
  mode?: "copy" | "move";
  name?: string;
}): Promise<{ id: string; webViewLink?: string }> {
  if ((input.mode ?? "copy") === "move") {
    return googleApiJson<{ id: string; webViewLink?: string }>({
      url: `https://www.googleapis.com/drive/v3/files/${input.fileId}?addParents=${encodeURIComponent(input.parentId)}&fields=id,webViewLink`,
      method: "PATCH",
      accessToken: input.accessToken,
      body: input.name ? { name: input.name } : {},
    });
  }
  return googleApiJson<{ id: string; webViewLink?: string }>({
    url: `https://www.googleapis.com/drive/v3/files/${input.fileId}/copy?fields=id,webViewLink`,
    method: "POST",
    accessToken: input.accessToken,
    body: {
      ...(input.name ? { name: input.name } : {}),
      parents: [input.parentId],
    },
  });
}

export async function ensureWorkspaceFolderStructure(input: {
  tenantId: string;
  accessToken: string;
}) {
  const root = await findOrCreateFolder({ accessToken: input.accessToken, name: "Job Applications" });
  const templates = await findOrCreateFolder({
    accessToken: input.accessToken,
    name: "Templates",
    parentId: root.folder.id,
  });
  const reports = await findOrCreateFolder({
    accessToken: input.accessToken,
    name: "Reports",
    parentId: root.folder.id,
  });
  const applications = await findOrCreateFolder({
    accessToken: input.accessToken,
    name: "Applications",
    parentId: root.folder.id,
  });
  const aiDrafts = await findOrCreateFolder({
    accessToken: input.accessToken,
    name: "AI Drafts",
    parentId: root.folder.id,
  });

  const reportChildren = await Promise.all(
    ["Salary Research", "Pipeline Metrics", "Offer Comparison", "Weekly Reports", "Daily Digests"].map((name) =>
      findOrCreateFolder({
        accessToken: input.accessToken,
        name,
        parentId: reports.folder.id,
      })
    )
  );

  await IntegrationConnectionModel.findOneAndUpdate(
    { tenantId: input.tenantId, provider: "Google Drive" },
    {
      $set: {
        "metadata.folderStructure.rootFolderId": root.folder.id,
        "metadata.folderStructure.templatesFolderId": templates.folder.id,
        "metadata.folderStructure.reportsFolderId": reports.folder.id,
        "metadata.folderStructure.applicationsFolderId": applications.folder.id,
        "metadata.folderStructure.aiDraftsFolderId": aiDrafts.folder.id,
        "metadata.folderStructure.updatedAt": new Date().toISOString(),
      },
    }
  );

  return {
    root,
    templates,
    reports,
    applications,
    aiDrafts,
    reportChildren,
  };
}
