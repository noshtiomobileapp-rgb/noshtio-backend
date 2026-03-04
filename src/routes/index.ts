import { Router } from "express";

import menuUploadRoutes from "./menu.upload.routes";
import menuRoutes from "./menuRoutes";
import vendorRoutes from "./vendorRoutes";
import vendorOrdersRoutes from "./vendorOrders.routes";

const router = Router();

/* ============================================================
   ROUTE REGISTRATION
============================================================ */

router.use("/vendor/menu", menuUploadRoutes);
router.use("/menu", menuRoutes);
router.use("/vendor", vendorRoutes);
router.use("/vendor/orders", vendorOrdersRoutes);

export default router;
