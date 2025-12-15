import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  role: string;
  isLoggedIn: boolean;
  lastLoginAt?: Date;
  lastLogoutAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "user" },
    isLoggedIn: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
    lastLogoutAt: { type: Date },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", UserSchema);
