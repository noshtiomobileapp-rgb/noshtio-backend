import { Router } from "express";
import { getVendorMe } from "./vendor.controller";
import vendorAuth from "./vendor.middleware";

const router = Router();

router.get("/me", vendorAuth, getVendorMe);

export default router;
