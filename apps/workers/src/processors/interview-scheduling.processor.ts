export type InterviewSchedulingPayload = {
  tenantId: string;
  interviewId: string;
  userId: string;
  operationId?: string;
};

export async function processInterviewSchedulingJob(payload: InterviewSchedulingPayload) {
  // TODO: Replace with BullMQ/Redis queue processor and API transport.
  return {
    queued: true,
    moduleKey: "interview-scheduling",
    operationId: payload.operationId ?? `interview-scheduling-${Date.now()}`,
    payload,
  };
}
