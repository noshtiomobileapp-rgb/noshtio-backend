import mongoose, { Schema, Document } from "mongoose";

/* ============================================================
   TYPES (MVP LOCKED)
============================================================ */

export type OrderStatus =
  | "NEW"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

export interface OrderDocument extends Document {
  vendorId: mongoose.Types.ObjectId;
  status: OrderStatus;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

/* ============================================================
   SCHEMA
============================================================ */

const OrderSchema = new Schema<OrderDocument>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["NEW", "PREPARING", "READY", "COMPLETED", "CANCELLED"],
      required: true,
      index: true,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

/* ============================================================
   MODEL REGISTRATION (CRITICAL)
============================================================ */

// ✅ Default export (mongoose usage)
const OrderModel =
  mongoose.models.Order ||
  mongoose.model<OrderDocument>("Order", OrderSchema);

export default OrderModel;

// ✅ Named export (TypeScript imports across codebase)
export { OrderModel };
