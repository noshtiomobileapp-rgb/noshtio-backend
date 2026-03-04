import { Schema, model, Types } from "mongoose";

const menuSchema = new Schema(
  {
    vendor: {
      type: Types.ObjectId,
      ref: "Vendor",
      required: true,
      unique: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    originalName: String,
    mimeType: String,
  },
  { timestamps: true }
);

export default model("Menu", menuSchema);
