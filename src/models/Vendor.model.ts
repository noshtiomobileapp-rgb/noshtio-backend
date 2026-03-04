import mongoose, { Schema, Document } from "mongoose";

export interface IVendor extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  email: string;
  role: "vendor";
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema = new Schema<IVendor>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ["vendor"],
      default: "vendor",
    },
  },
  { timestamps: true }
);

export default mongoose.model<IVendor>("Vendor", VendorSchema);
