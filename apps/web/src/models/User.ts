import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name:          string;
  email:         string;
  image?:        string;
  role:          "admin" | "user";
  passwordHash?: string;
  integrations: {
    google?: {
      accessToken?:  string;
      refreshToken?: string;
      expiresAt?:    number;
    };
  };
  preferences: {
    timezone:            string;
    digestTime:          string;
    weeklyReportDay:     number;
    emailNotifications:  boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name:         { type: String, required: true },
    email:        { type: String, required: true, unique: true, lowercase: true },
    image:        String,
    role:         { type: String, enum: ["admin", "user"], default: "user" },
    passwordHash: String,
    integrations: {
      google: {
        accessToken:  String,
        refreshToken: String,
        expiresAt:    Number,
      },
    },
    preferences: {
      timezone:           { type: String, default: "UTC" },
      digestTime:         { type: String, default: "08:00" },
      weeklyReportDay:    { type: Number, default: 1 },
      emailNotifications: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

const UserModel: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);

export default UserModel;
