import { listApplications } from "@/lib/api/applications.api";
import { me } from "@/lib/api/auth.api";
import { listContacts } from "@/lib/api/contacts.api";
import { listDocuments } from "@/lib/api/documents.api";
import { listJobs } from "@/lib/api/jobs.api";
import { normalizeListResponse } from "@/lib/api/normalizeResource";

export type WorkspaceExportType = "jobs" | "applications" | "contacts" | "documents" | "full";

async function fetchAllPages<T>(
  fetchPage: (page: number, limit: number) => Promise<unknown>,
  pageSize: number
): Promise<T[]> {
  const all: T[] = [];
  let page = 1;
  while (true) {
    const payload = await fetchPage(page, pageSize);
    const batch = normalizeListResponse<T>(payload);
    all.push(...batch);
    if (batch.length < pageSize) break;
    page += 1;
  }
  return all;
}

export async function buildWorkspaceExport(type: WorkspaceExportType) {
  const session = await me();
  const base = {
    exportDate: new Date().toISOString(),
    exportType: type,
    workspace: session.tenant?.name ?? "Workspace",
    workspaceId: session.tenant?.id,
    exportedBy: session.user?.email,
  };

  if (type === "jobs") {
    const jobs = await fetchAllPages<unknown>((page, limit) => listJobs({ page, limit }), 200);
    return { ...base, count: jobs.length, jobs };
  }
  if (type === "applications") {
    const applications = await fetchAllPages<unknown>((page, limit) => listApplications({ page, limit }), 100);
    return { ...base, count: applications.length, applications };
  }
  if (type === "contacts") {
    const contacts = await fetchAllPages<unknown>((page, limit) => listContacts({ page, limit }), 100);
    return { ...base, count: contacts.length, contacts };
  }
  if (type === "documents") {
    const documents = await fetchAllPages<unknown>((page, limit) => listDocuments({ page, limit }), 100);
    return { ...base, count: documents.length, documents };
  }

  const [jobs, applications, contacts, documents] = await Promise.all([
    fetchAllPages<unknown>((page, limit) => listJobs({ page, limit }), 200),
    fetchAllPages<unknown>((page, limit) => listApplications({ page, limit }), 100),
    fetchAllPages<unknown>((page, limit) => listContacts({ page, limit }), 100),
    fetchAllPages<unknown>((page, limit) => listDocuments({ page, limit }), 100),
  ]);

  return {
    ...base,
    jobs: { count: jobs.length, data: jobs },
    applications: { count: applications.length, data: applications },
    contacts: { count: contacts.length, data: contacts },
    documents: { count: documents.length, data: documents },
  };
}
