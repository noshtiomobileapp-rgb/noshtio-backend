import { Request, Response } from "express";
import {
  createPaymentOrder,
  completePayment,
  getPaymentStatus,
  getPaymentByOrderId,
  refundPayment,
} from "./payment.service";

/* ============================================================
   CREATE PAYMENT ORDER
   POST /api/payments/create
   Customer initiates payment for an order
============================================================ */

export const createPaymentHandler = async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).user?.id;
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required",
      });
    }

    const payment = await createPaymentOrder(orderId, customerId);

    return res.status(201).json({
      success: true,
      message: "Payment order created",
      data: {
        paymentId: payment.paymentId,
        razorpayOrderId: payment.razorpayOrderId,
        amount: payment.amount,
        currency: payment.currency,
        orderId: payment.orderId,
        // Additional data for frontend checkout
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (err: any) {
    console.error("CREATE PAYMENT ERROR:", err);

    if (err.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (err.message.includes("already completed")) {
      return res.status(400).json({
        success: false,
        message: "Payment already completed for this order",
      });
    }

    if (err.message.includes("not configured")) {
      return res.status(503).json({
        success: false,
        message: "Payment service is not available",
      });
    }

    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to create payment order",
    });
  }
};

/* ============================================================
   VERIFY PAYMENT
   POST /api/payments/verify
   Verify Razorpay signature and complete payment
============================================================ */

export const verifyPaymentHandler = async (req: Request, res: Response) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    // Validate input
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: "razorpayOrderId, razorpayPaymentId, and razorpaySignature are required",
      });
    }

    const payment = await completePayment(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    return res.json({
      success: true,
      message: "Payment verified and completed",
      data: {
        paymentId: payment.paymentId,
        orderId: payment.orderId,
        status: payment.status,
        amount: payment.amount,
        orderStatus: payment.orderStatus,
      },
    });
  } catch (err: any) {
    console.error("VERIFY PAYMENT ERROR:", err);

    if (err.message.includes("Invalid payment signature")) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed - invalid signature",
      });
    }

    if (err.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to verify payment",
    });
  }
};

/* ============================================================
   GET PAYMENT STATUS
   GET /api/payments/:paymentId
   View payment status
============================================================ */

export const getPaymentStatusHandler = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID is required",
      });
    }

    const payment = await getPaymentStatus(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    return res.json({
      success: true,
      data: payment,
    });
  } catch (err: any) {
    console.error("GET PAYMENT STATUS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to fetch payment status",
    });
  }
};

/* ============================================================
   GET PAYMENT BY ORDER
   GET /api/payments/order/:orderId
   View payment for an order
============================================================ */

export const getPaymentByOrderHandler = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    const payment = await getPaymentByOrderId(orderId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "No payment found for this order",
      });
    }

    return res.json({
      success: true,
      data: payment,
    });
  } catch (err: any) {
    console.error("GET PAYMENT BY ORDER ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to fetch payment",
    });
  }
};

/* ============================================================
   REFUND PAYMENT
   POST /api/payments/:paymentId/refund
   Vendor initiates refund
============================================================ */

export const refundPaymentHandler = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID is required",
      });
    }

    const refund = await refundPayment(paymentId, reason);

    return res.json({
      success: true,
      message: "Payment refunded successfully",
      data: refund,
    });
  } catch (err: any) {
    console.error("REFUND PAYMENT ERROR:", err);

    if (err.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (err.message.includes("Only completed payments")) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to refund payment",
    });
  }
};
