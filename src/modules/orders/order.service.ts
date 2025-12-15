import mongoose, { Document, Schema } from "mongoose";

export type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled"
  | "rejected"
  | "completed";

export interface IOrderItem {
  itemId: mongoose.Types.ObjectId;
  name: string;       // snapshot name at order time
  qty: number;
  price: number;      // snapshot price at order time
  total: number;      // qty * price
  notes?: string;
}

export interface IOrder extends Document {
  tenantId?: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  tableId?: string | null;
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  serviceCharge?: number;
  discount?: number;
  total: number;
  status: OrderStatus;
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
  itemId: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true }, // FIXED
  name: { type: String, required: true },
  qty: { type: Number, required: true },
  price: { type: Number, required: true },
  total: { type: Number, required: true },
  notes: { type: String },
});

const OrderSchema = new Schema<IOrder>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant" },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tableId: { type: String, default: null },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    serviceCharge: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "pending",
        "preparing",
        "ready",
        "delivered",
        "cancelled",
        "rejected",
        "completed",
      ],
      default: "pending",
    },
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

export const OrderModel = mongoose.model<IOrder>("Order", OrderSchema);
