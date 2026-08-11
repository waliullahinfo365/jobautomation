"use client";

import { useRef, useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { uploadAvatar, removeAvatar } from "@/lib/api/auth.api";
import { showError, showSuccess } from "@/lib/ui/toast";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";

interface ProfilePhotoUploadProps {
  name: string;
  avatarUrl?: string;
  avatarInitials: string;
  onUpdated: (avatarUrl?: string) => void;
  className?: string;
  /** Compact embed inside a parent identity card */
  embedded?: boolean;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

export function ProfilePhotoUpload({
  name,
  avatarUrl,
  avatarInitials,
  onUpdated,
  className,
  embedded = false,
}: ProfilePhotoUploadProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    setPreviewUrl(avatarUrl);
  }, [avatarUrl]);

  const displayUrl = previewUrl ?? avatarUrl;

  async function handleFileChange(file: File | null) {
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      showError(t("profile.photoInvalidType"));
      return;
    }
    if (file.size > MAX_BYTES) {
      showError(t("profile.photoTooLarge"));
      return;
    }

    setUploading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const result = await uploadAvatar(dataUrl);
      const nextUrl = result.user.avatarUrl;
      setPreviewUrl(nextUrl);
      onUpdated(nextUrl);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("profile-photo-updated", { detail: { avatarUrl: nextUrl } }));
      }
      showSuccess(t("profile.photoUploadSuccess"));
    } catch (error) {
      showError(error instanceof Error ? error.message : t("profile.photoUploadFailed"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    setRemoving(true);
    try {
      await removeAvatar();
      setPreviewUrl(undefined);
      onUpdated(undefined);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("profile-photo-updated", { detail: { avatarUrl: undefined } }));
      }
      showSuccess(t("profile.photoRemoveSuccess"));
    } catch (error) {
      showError(error instanceof Error ? error.message : t("profile.photoRemoveFailed"));
    } finally {
      setRemoving(false);
    }
  }

  const initials =
    avatarInitials?.trim() ||
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") ||
    "U";

  return (
    <div
      className={cn(
        !embedded && "rounded-2xl border border-[var(--border-default)] bg-[var(--surface-2)] p-4",
        className
      )}
    >
      {!embedded ? (
        <>
          <p className="text-xs font-medium text-[var(--text-3)]">{t("profile.photoTitle")}</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-4)]">{t("profile.photoDescription")}</p>
        </>
      ) : null}

      <div className={cn("flex flex-col items-start gap-4 sm:flex-row sm:items-center", !embedded && "mt-4")}>
        <Avatar className="h-24 w-24 border border-[var(--border-default)] lg:h-28 lg:w-28">
          {displayUrl ? <AvatarImage src={displayUrl} alt={name} /> : null}
          <AvatarFallback className="text-xl font-semibold">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto">
          {embedded ? (
            <>
              <p className="text-[13px] font-semibold text-[var(--text-1)]">{t("profile.photoTitle")}</p>
              <p className="max-w-sm text-[12px] leading-relaxed text-[var(--text-4)]">{t("profile.photoHint")}</p>
            </>
          ) : null}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => void handleFileChange(e.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            variant="outline"
            className="min-h-[44px] w-full touch-manipulation sm:w-auto"
            disabled={uploading || removing}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? t("profile.photoUploading") : displayUrl ? t("profile.photoReplace") : t("profile.photoUpload")}
          </Button>
          {displayUrl ? (
            <Button
              type="button"
              variant="ghost"
              className="min-h-[40px] w-full touch-manipulation sm:w-auto"
              disabled={uploading || removing}
              onClick={() => void handleRemove()}
            >
              {removing ? t("common.loading") : t("profile.photoRemove")}
            </Button>
          ) : null}
        </div>
      </div>

      {!embedded ? (
        <p className="mt-3 text-[11px] leading-relaxed text-[var(--text-4)]">{t("profile.photoHint")}</p>
      ) : null}
    </div>
  );
}
