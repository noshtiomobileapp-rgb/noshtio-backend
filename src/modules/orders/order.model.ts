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

export interface OrderItem {
  itemId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface OrderDocument extends Document {
  vendorId: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId | null;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  tableId?: string;
  orderNumber: string;
  specialNote?: string;
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

    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    items: [
      {
        itemId: {
          type: Schema.Types.ObjectId,
          ref: "Item",
          required: true,
        },
        name: String,
        price: Number,
        quantity: { type: Number, min: 1 },
        subtotal: Number,
      },
    ],

    status: {
      type: String,
      enum: ["NEW", "PREPARING", "READY", "COMPLETED", "CANCELLED"],
      default: "NEW",
      required: true,
      index: true,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    tableId: {
      type: String,
      default: null,
    },

    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    specialNote: String,
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
