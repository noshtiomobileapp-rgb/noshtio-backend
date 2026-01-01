import { Schema, model, Types } from "mongoose";

const MenuDraftSchema = new Schema(
  {
    restaurantId: {
      type: Types.ObjectId,
      required: true,
      index: true,
    },

    source: {
      type: String,
      enum: ["OCR", "MANUAL"],
      default: "OCR",
    },

    rawText: String,

    parsedMenu: {
      type: Array, // ParsedMenuCategory[]
      required: true,
    },

    uploadedFileUrl: String,

    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED"],
      default: "DRAFT",
    },
  },
  { timestamps: true }
);

export default model("MenuDraft", MenuDraftSchema);
