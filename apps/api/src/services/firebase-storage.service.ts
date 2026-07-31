/**
 * Firebase Storage helpers for CV / cover letter binaries.
 * Users never talk to Firebase directly — only the API (service account).
 */
import { readFileSync, existsSync } from "node:fs";
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

export type FirebaseUploadResult = {
  storageProvider: "Firebase";
  storagePath: string;
  storageLocation: string;
  bucket: string;
  contentType: string;
  sizeBytes: number;
};

function normalizePrivateKey(raw: string): string {
  return raw.replace(/\\n/g, "\n").trim();
}

function isFirebaseConfigured(): boolean {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const bucket = process.env.FIREBASE_STORAGE_BUCKET?.trim();
  if (!projectId || !bucket) return false;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim()) return true;
  return Boolean(process.env.FIREBASE_CLIENT_EMAIL?.trim() && process.env.FIREBASE_PRIVATE_KEY?.trim());
}

export function firebaseStorageEnabled(): boolean {
  return isFirebaseConfigured();
}

let app: App | null = null;

function getFirebaseApp(): App {
  if (app) return app;
  const existing = getApps()[0];
  if (existing) {
    app = existing;
    return app;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  if (!projectId) throw new Error("FIREBASE_PROJECT_ID is not set");

  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  if (path) {
    if (!existsSync(path)) throw new Error(`Firebase service account file not found: ${path}`);
    const json = JSON.parse(readFileSync(path, "utf8")) as {
      project_id?: string;
      client_email?: string;
      private_key?: string;
    };
    app = initializeApp({
      credential: cert({
        projectId: json.project_id || projectId,
        clientEmail: String(json.client_email),
        privateKey: normalizePrivateKey(String(json.private_key ?? "")),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET?.trim(),
    });
    return app;
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!clientEmail || !privateKey) {
    throw new Error("Firebase credentials missing (FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY)");
  }

  app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: normalizePrivateKey(privateKey),
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET?.trim(),
  });
  return app;
}

function getBucket() {
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET?.trim();
  if (!bucketName) throw new Error("FIREBASE_STORAGE_BUCKET is not set");
  getFirebaseApp();
  return getStorage().bucket(bucketName);
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.\-()+ ]+/g, "_").replace(/\s+/g, "-").slice(0, 120) || "file";
}

export function buildFirebaseObjectPath(input: {
  tenantId: string;
  userId: string;
  documentId: string;
  fileName: string;
  jobId?: string;
}): string {
  const safe = sanitizeFileName(input.fileName);
  if (input.jobId) {
    return `tenants/${input.tenantId}/jobs/${input.jobId}/documents/${input.documentId}/${safe}`;
  }
  return `tenants/${input.tenantId}/users/${input.userId}/documents/${input.documentId}/${safe}`;
}

export async function uploadBufferToFirebase(input: {
  tenantId: string;
  userId: string;
  documentId: string;
  fileName: string;
  buffer: Buffer;
  contentType: string;
  jobId?: string;
}): Promise<FirebaseUploadResult> {
  const bucket = getBucket();
  const storagePath = buildFirebaseObjectPath(input);
  const file = bucket.file(storagePath);
  await file.save(input.buffer, {
    contentType: input.contentType,
    resumable: false,
    metadata: {
      metadata: {
        tenantId: input.tenantId,
        userId: input.userId,
        documentId: input.documentId,
        jobId: input.jobId ?? "",
      },
    },
  });

  return {
    storageProvider: "Firebase",
    storagePath,
    storageLocation: `Firebase/${storagePath}`,
    bucket: bucket.name,
    contentType: input.contentType,
    sizeBytes: input.buffer.length,
  };
}

export async function downloadFirebaseObject(storagePath: string): Promise<{
  buffer: Buffer;
  contentType: string;
}> {
  const bucket = getBucket();
  const file = bucket.file(storagePath);
  const [buffer] = await file.download();
  const [meta] = await file.getMetadata();
  return {
    buffer,
    contentType: String(meta.contentType ?? "application/octet-stream"),
  };
}

export async function getFirebaseSignedUrl(storagePath: string, expiresInMs = 60 * 60 * 1000): Promise<string> {
  const bucket = getBucket();
  const file = bucket.file(storagePath);
  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + expiresInMs,
  });
  return url;
}
