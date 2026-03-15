import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import {
  createPaymentHandler,
  verifyPaymentHandler,
  getPaymentStatusHandler,
  getPaymentByOrderHandler,
  refundPaymentHandler,
} from "./payment.controller";

const router = Router();

/* ============================================================
   PAYMENT ROUTES
   All routes require authentication
============================================================ */

// POST /api/payments/create — initiate payment for order
router.post("/create", requireAuth, createPaymentHandler);

// POST /api/payments/verify — verify Razorpay signature
router.post("/verify", verifyPaymentHandler);

// GET /api/payments/:paymentId — view payment status
router.get("/:paymentId", getPaymentStatusHandler);

// GET /api/payments/order/:orderId — get payment for order
router.get("/order/:orderId", getPaymentByOrderHandler);

// POST /api/payments/:paymentId/refund — refund payment
router.post("/:paymentId/refund", requireAuth, refundPaymentHandler);

export default router;
