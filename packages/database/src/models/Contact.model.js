import { model, models, Schema } from "mongoose";
import { applyBaseIndexes, withBaseFields } from "../schemas/base.schema";
const ContactSchema = new Schema(withBaseFields({ name: { type: String, required: true }, company: String, role: String, relationship: { type: String, enum: ["Recruiter", "Hiring Manager", "Referral", "Employee", "Networking", "Other"], required: true }, email: String, phone: String, linkedInUrl: String, location: String, source: String, followUpStatus: { type: String, enum: ["Not Needed", "Scheduled", "Due Today", "Overdue", "Sent"], default: "Not Needed" }, nextFollowUpDate: Date, followUpReason: String, followUpMessagePreview: String, reminderEnabled: { type: Boolean, default: false }, relatedJobIds: { type: [String], default: [] }, notes: String, lastContacted: Date, archived: { type: Boolean, default: false } }), { timestamps: true });
applyBaseIndexes(ContactSchema, true);
ContactSchema.index({ tenantId: 1, email: 1 });
ContactSchema.index({ tenantId: 1, relationship: 1 });
ContactSchema.index({ nextFollowUpDate: 1 });
export const ContactModel = models.Contact || model("Contact", ContactSchema);
