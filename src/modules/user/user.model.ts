import mongoose, { Schema, Document } from "mongoose";

export interface IUserProfile extends Document {
  name: string;
  email: string;
  role: string;
}

const UserProfileSchema = new Schema<IUserProfile>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, default: "user" },
  },
  { timestamps: true }
);

export const UserProfile = mongoose.model<IUserProfile>(
  "UserProfile",
  UserProfileSchema
);
