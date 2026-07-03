"use client";

import { JobInboxPage } from "@/components/jobs/JobInboxPage";
import { JobsAdvancedPage } from "@/components/jobs/JobsAdvancedPage";
import { useAdvancedUi } from "@/context/AuthSessionContext";

export default function JobsPage() {
  const advancedUi = useAdvancedUi();

  if (advancedUi) {
    return <JobsAdvancedPage />;
  }

  return <JobInboxPage />;
}
