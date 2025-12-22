import mongoose, { Document, Schema } from "mongoose";

/**
 * MVP Kitchen Flow Statuses (Linear, Vendor-First)
 */
export type OrderStatus =
  | "NEW"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

export interface IOrderItem {
  itemId: mongoose.Types.ObjectId;
  name: string;
  qty: number;
  price: number;
  total: number;
  notes?: string;
}

export interface IOrder extends Document {
  tenantId?: mongoose.Types.ObjectId | string;

  userId?: mongoose.Types.ObjectId | string | null;
  sessionId?: string | null;
  tableId?: string | null;

  items: IOrderItem[];

  subtotal: number;
  tax: number;
  serviceCharge?: number;
  discount?: number;
  total: number;

  status: OrderStatus;

  preparingAt?: Date;
  readyAt?: Date;
  completedAt?: Date;

  payment?: {
    provider?: string;
    method?: string;
    status?: "unpaid" | "paid" | "refunded" | "failed";
    transactionId?: string;
  };

  instructions?: string;

  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
  name: { type: String, required: true },
  qty: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  total: { type: Number, required: true },
  notes: String,
});

const OrderSchema = new Schema<IOrder>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", index: true },

    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    sessionId: { type: String, index: true },
    tableId: { type: String, default: null },

    items: { type: [OrderItemSchema], required: true },

    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    serviceCharge: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },

    status: {
      type: String,
      enum: ["NEW", "PREPARING", "READY", "COMPLETED", "CANCELLED"],
      default: "NEW",
      index: true,
    },

    preparingAt: Date,
    readyAt: Date,
    completedAt: Date,

    payment: {
      provider: String,
      method: String,
      status: {
        type: String,
        enum: ["unpaid", "paid", "refunded", "failed"],
        default: "unpaid",
      },
      transactionId: String,
    },

    instructions: String,
  },
  { timestamps: true }
);

/* 🔐 HARD GUARANTEE */
OrderSchema.pre("validate", function (next) {
  if (!this.userId && !this.sessionId) {
    next(new Error("Order must have either userId or sessionId"));
  }
  next();
});

export const OrderModel = mongoose.model<IOrder>("Order", OrderSchema);
