import mongoose, { Schema, Document, Model } from "mongoose";
import { CONTACT_TYPES } from "@/config/statuses";

export interface IContact extends Document {
  firstName:    string;
  lastName:     string;
  fullName:     string;
  email?:       string;
  phone?:       string;
  linkedinUrl?: string;
  company?:     string;
  title?:       string;
  type:         string;
  jobIds:       mongoose.Types.ObjectId[];
  notes?:       string;
  lastContactedAt?: Date;
  followUpDue?:     Date;
  createdAt:    Date;
  updatedAt:    Date;
}

const ContactSchema = new Schema<IContact>(
  {
    firstName:    { type: String, required: true, trim: true },
    lastName:     { type: String, required: true, trim: true },
    fullName:     { type: String },
    email:        { type: String, trim: true, lowercase: true },
    phone:        { type: String },
    linkedinUrl:  { type: String },
    company:      { type: String },
    title:        { type: String },
    type: {
      type:    String,
      enum:    CONTACT_TYPES,
      default: "Other",
    },
    jobIds:           [{ type: Schema.Types.ObjectId, ref: "Job" }],
    notes:            String,
    lastContactedAt:  Date,
    followUpDue:      Date,
  },
  { timestamps: true }
);

// Automatically compute fullName before saving.
ContactSchema.pre("save", function (next) {
  this.fullName = `${this.firstName} ${this.lastName}`.trim();
  next();
});

ContactSchema.index({ fullName: "text", email: "text", company: "text" });

const ContactModel: Model<IContact> =
  mongoose.models.Contact ?? mongoose.model<IContact>("Contact", ContactSchema);

export default ContactModel;
