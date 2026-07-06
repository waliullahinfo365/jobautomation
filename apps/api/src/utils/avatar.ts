import { ApiError } from "./errors";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const DATA_URL_RE = /^data:(image\/(?:jpeg|png|webp));base64,([a-zA-Z0-9+/=\s]+)$/;

export function parseAvatarDataUrl(imageData: string): { mime: string; dataUrl: string } {
  const trimmed = imageData.trim();
  const match = trimmed.match(DATA_URL_RE);
  if (!match) {
    throw new ApiError("Upload a JPG, PNG, or WebP image.", 422, "INVALID_AVATAR_FORMAT");
  }
  const mime = match[1];
  const base64 = match[2].replace(/\s/g, "");
  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64, "base64");
  } catch {
    throw new ApiError("Image data is invalid.", 422, "INVALID_AVATAR_FORMAT");
  }
  if (buffer.length === 0) {
    throw new ApiError("Image file is empty.", 422, "INVALID_AVATAR_FORMAT");
  }
  if (buffer.length > MAX_AVATAR_BYTES) {
    throw new ApiError("Image must be 2 MB or smaller.", 422, "AVATAR_TOO_LARGE");
  }
  return { mime, dataUrl: `data:${mime};base64,${base64}` };
}
