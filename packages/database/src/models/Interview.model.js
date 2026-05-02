import { model, models, Schema } from "mongoose";
import { applyBaseIndexes, withBaseFields } from "../schemas/base.schema";
const PrepChecklistItemSchema = new Schema({ label: { type: String, required: true }, done: { type: Boolean, default: false } }, { _id: false });
const InterviewSchema = new Schema(withBaseFields({
    jobId: String,
    applicationId: String,
    company: { type: String, required: true },
    position: { type: String, required: true },
    interviewType: {
        type: String,
        enum: ["Recruiter Screen", "Technical", "Behavioral", "Hiring Manager", "Panel", "Final Round", "Offer Discussion"],
        required: true,
    },
    status: { type: String, enum: ["Scheduled", "Awaiting Confirmation", "Rescheduled", "Completed", "Cancelled", "No Show"], required: true },
    dateTime: { type: Date, required: true },
    durationMinutes: Number,
    interviewerName: String,
    interviewerRole: String,
    contactEmail: String,
    meetingLink: String,
    location: String,
    prepStatus: { type: String, enum: ["Not Started", "In Progress", "Ready", "Overdue"], default: "Not Started" },
    calendarStatus: { type: String, enum: ["Not Created", "Queued", "Created", "Failed"], default: "Not Created" },
    calendarEventId: String,
    calendarEventUrl: String,
    calendarCreatedAt: Date,
    calendarError: String,
    notesSummary: String,
    aiPrepSummary: String,
    followUpMessagePreview: String,
    prepChecklist: { type: [PrepChecklistItemSchema], default: [] },
}), { timestamps: true });
applyBaseIndexes(InterviewSchema, true);
InterviewSchema.index({ tenantId: 1, dateTime: 1 });
InterviewSchema.index({ tenantId: 1, status: 1 });
InterviewSchema.index({ jobId: 1 });
InterviewSchema.index({ applicationId: 1 });
export const InterviewModel = models.Interview || model("Interview", InterviewSchema);
