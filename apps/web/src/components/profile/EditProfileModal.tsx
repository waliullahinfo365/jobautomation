"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { showInfo } from "@/lib/ui/toast";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: {
    name: string;
    email: string;
    workspaceName: string;
  };
  onSave?: (profile: { name: string; email: string; workspaceName: string }) => void;
}

export function EditProfileModal({
  isOpen,
  onClose,
  currentProfile,
  onSave,
}: EditProfileModalProps) {
  const [name, setName] = useState(currentProfile.name);
  const [email, setEmail] = useState(currentProfile.email);
  const [workspaceName, setWorkspaceName] = useState(currentProfile.workspaceName);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !email.trim() || !workspaceName.trim()) {
      showInfo("Please fill in all fields.");
      return;
    }

    setIsSaving(true);
    try {
      // Simulate save operation
      await new Promise((resolve) => setTimeout(resolve, 500));

      const updatedProfile = { name, email, workspaceName };
      onSave?.(updatedProfile);

      showInfo("Profile changes are saved locally for this demo. Backend profile update will be connected next.");
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName(currentProfile.name);
    setEmail(currentProfile.email);
    setWorkspaceName(currentProfile.workspaceName);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Edit Profile"
      description="Update your profile information"
      size="md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-2)] mb-2">Full Name</label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-2)] mb-2">Email</label>
          <Input type="email" value={email} disabled placeholder="Email cannot be changed" />
          <p className="mt-1 text-xs text-[var(--text-3)]">Email changes must be made through account recovery.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-2)] mb-2">Workspace Name</label>
          <Input
            type="text"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            placeholder="Enter workspace name"
          />
        </div>

        <div className="border-t border-[var(--border-default)] pt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
