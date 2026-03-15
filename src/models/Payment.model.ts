import mongoose, { Schema, Document } from "mongoose";

/* ============================================================
   PAYMENT MODEL
   Tracks all order payments via Razorpay
============================================================ */

export interface IPayment extends Document {
  orderId: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;

  // Razorpay order details
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;

  // Payment info
  amount: number; // in paise (₹1 = 100 paise)
  currency: string; // INR
  status: "pending" | "completed" | "failed" | "refunded";

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
      unique: true,
    },

    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      index: true,
    },

    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true,
    },

    razorpayOrderId: {
      type: String,
      required: true,
      index: true,
    },

    razorpayPaymentId: {
      type: String,
      default: null,
      index: true,
    },

    razorpaySignature: {
      type: String,
      default: null,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      enum: ["INR"],
      default: "INR",
    },

    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IPayment>("Payment", PaymentSchema);
