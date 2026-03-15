import crypto from "crypto";
import Payment from "../../models/Payment.model";
import Order from "../orders/order.model";
import mongoose from "mongoose";

/* ============================================================
   PAYMENT SERVICE
   Integrates with Razorpay for payment processing
============================================================ */

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

// Initialize Razorpay instance
let RazorpayInstance: any;

try {
  if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
    const Razorpay = require("razorpay");
    RazorpayInstance = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });
  }
} catch (err) {
  console.warn("Razorpay not initialized - payment features disabled");
}

/* ============================================================
   CREATE PAYMENT ORDER
   Generates Razorpay order ID for customer checkout
============================================================ */

export async function createPaymentOrder(
  orderId: string,
  customerId?: string,
  vendorId?: string
) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("Invalid order ID");
  }

  if (!RazorpayInstance) {
    throw new Error("Razorpay is not configured");
  }

  // Fetch order to get amount
  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  // Check if payment already exists
  const existingPayment = await Payment.findOne({ orderId });
  if (existingPayment && existingPayment.status === "completed") {
    throw new Error("Payment already completed for this order");
  }

  // Create Razorpay order
  const razorpayOrder = await RazorpayInstance.orders.create({
    amount: order.totalAmount, // in paise
    currency: "INR",
    receipt: `order_${orderId}`,
    notes: {
      orderId: orderId,
      customerId: customerId || "guest",
    },
  });

  // Save or update payment record
  const payment = await Payment.findOneAndUpdate(
    { orderId },
    {
      orderId,
      customerId: customerId ? new mongoose.Types.ObjectId(customerId) : null,
      vendorId: vendorId ? new mongoose.Types.ObjectId(vendorId) : order.vendorId,
      razorpayOrderId: razorpayOrder.id,
      amount: order.totalAmount,
      status: "pending",
    },
    { upsert: true, new: true }
  );

  return {
    paymentId: payment._id.toString(),
    razorpayOrderId: razorpayOrder.id,
    amount: order.totalAmount,
    currency: "INR",
    orderId: orderId,
  };
}

/* ============================================================
   VERIFY PAYMENT SIGNATURE
   Validates Razorpay webhook signature
============================================================ */

export function verifyPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  const message = `${razorpayOrderId}|${razorpayPaymentId}`;
  const digest = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(message)
    .digest("hex");

  return digest === razorpaySignature;
}

/* ============================================================
   COMPLETE PAYMENT
   Called after successful payment verification
============================================================ */

export async function completePayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
) {
  // Verify signature
  if (!verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
    throw new Error("Invalid payment signature");
  }

  // Find payment record
  const payment = await Payment.findOne({ razorpayOrderId });
  if (!payment) {
    throw new Error("Payment record not found");
  }

  // Update payment status
  payment.razorpayPaymentId = razorpayPaymentId;
  payment.razorpaySignature = razorpaySignature;
  payment.status = "completed";
  await payment.save();

  // Update order status to PREPARING (vendor accepted the payment)
  const order = await Order.findByIdAndUpdate(
    payment.orderId,
    { status: "PREPARING" },
    { new: true }
  );

  return {
    paymentId: payment._id.toString(),
    orderId: payment.orderId.toString(),
    status: "completed",
    amount: payment.amount,
    orderStatus: order?.status,
  };
}

/* ============================================================
   GET PAYMENT STATUS
============================================================ */

export async function getPaymentStatus(paymentId: string) {
  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    throw new Error("Invalid payment ID");
  }

  return Payment.findById(paymentId)
    .populate("orderId", "orderNumber status")
    .populate("customerId", "email firstName lastName")
    .lean();
}

/* ============================================================
   GET PAYMENT BY ORDER
============================================================ */

export async function getPaymentByOrderId(orderId: string) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("Invalid order ID");
  }

  return Payment.findOne({ orderId })
    .populate("orderId", "orderNumber status totalAmount")
    .lean();
}

/* ============================================================
   REFUND PAYMENT
============================================================ */

export async function refundPayment(paymentId: string, reason?: string) {
  if (!RazorpayInstance) {
    throw new Error("Razorpay is not configured");
  }

  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    throw new Error("Invalid payment ID");
  }

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new Error("Payment not found");
  }

  if (payment.status !== "completed") {
    throw new Error("Only completed payments can be refunded");
  }

  if (!payment.razorpayPaymentId) {
    throw new Error("No Razorpay payment ID found");
  }

  // Request refund from Razorpay
  const refund = await RazorpayInstance.payments.refund(
    payment.razorpayPaymentId,
    {
      notes: {
        reason: reason || "Customer requested refund",
      },
    }
  );

  // Update payment status
  payment.status = "refunded";
  await payment.save();

  return {
    paymentId: payment._id.toString(),
    refundId: refund.id,
    amount: payment.amount,
    status: "refunded",
  };
}
