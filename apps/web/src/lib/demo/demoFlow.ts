import type { Application } from "@/types/application";
import type { DocumentRecord } from "@/types/document";
import type { Interview } from "@/types/interview";
import type { Job } from "@/types/job";

function pickId(record: { id?: string; _id?: string } | undefined): string | undefined {
  if (!record) return undefined;
  return record.id ?? record._id;
}

export function getFirstAvailableJob(jobs: Job[] | undefined | null): Job | undefined {
  if (!jobs?.length) return undefined;
  return jobs[0];
}

export function getFirstAvailableApplication(applications: Application[] | undefined | null): Application | undefined {
  if (!applications?.length) return undefined;
  return applications.find((a) => pickId(a)) ?? applications[0];
}

export function getFirstAvailableInterview(interviews: Interview[] | undefined | null): Interview | undefined {
  if (!interviews?.length) return undefined;
  return interviews.find((i) => pickId(i)) ?? interviews[0];
}

export function getFirstAvailableDocument(documents: DocumentRecord[] | undefined | null): DocumentRecord | undefined {
  if (!documents?.length) return undefined;
  return documents.find((d) => pickId(d)) ?? documents[0];
}

export function buildDemoIntakePayload(): { from: string; subject: string; bodyText: string } {
  return {
    from: "alerts@jobs.demo.jobflow.ai",
    subject: "Demo intake — Staff Engineer at Aurora Labs",
    bodyText:
      "Aurora Labs is hiring a Staff Engineer.\n\nRole: platform reliability.\nApply: https://careers.demo/job/48291\nLocation: Remote (US)\nPosted: today\n\nThis message was generated for the guided demo intake step.",
  };
}

export function buildDemoReplyPayload(application: Application): Record<string, unknown> {
  const thread =
    typeof application.providerThreadId === "string" && application.providerThreadId.length > 0
      ? application.providerThreadId
      : `demo-thread-${pickId(application) ?? "app"}`;
  return {
    provider: "test",
    providerMessageId: `demo-reply-msg-${Date.now()}`,
    providerThreadId: thread,
    from: application.contactEmail || "recruiter@demo.jobflow.ai",
    subject: "Re: interview scheduling — next steps",
    bodyText:
      "Thanks for applying. We would like to schedule a technical interview next week — please share availability.",
    receivedAt: new Date().toISOString(),
  };
}
