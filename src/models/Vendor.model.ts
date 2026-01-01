import mongoose, { Schema, Document } from "mongoose";

export interface VendorDocument extends Document {
  name: string;
  email: string;
  password: string;
  role: "vendor";
}

const VendorSchema = new Schema<VendorDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "vendor" },
  },
  { timestamps: true }
);

export default mongoose.model<VendorDocument>("Vendor", VendorSchema);
