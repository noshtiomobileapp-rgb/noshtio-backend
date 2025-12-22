import { Router } from "express";
import {
  listKitchenOrders,
  updateKitchenOrderStatus,
} from "./order.kitchen.controller";

const router = Router();

/**
 * Kitchen order listing
 */
router.get("/orders", listKitchenOrders);

/**
 * Explicit kitchen actions
 */
router.patch("/orders/:id/accept", (req, res, next) => {
  req.body.status = "ACCEPTED";
  next();
}, updateKitchenOrderStatus);

router.patch("/orders/:id/prepare", (req, res, next) => {
  req.body.status = "PREPARING";
  next();
}, updateKitchenOrderStatus);

router.patch("/orders/:id/ready", (req, res, next) => {
  req.body.status = "READY";
  next();
}, updateKitchenOrderStatus);

router.patch("/orders/:id/complete", (req, res, next) => {
  req.body.status = "COMPLETED";
  next();
}, updateKitchenOrderStatus);

router.patch("/orders/:id/cancel", (req, res, next) => {
  req.body.status = "CANCELLED";
  next();
}, updateKitchenOrderStatus);

export default router;
