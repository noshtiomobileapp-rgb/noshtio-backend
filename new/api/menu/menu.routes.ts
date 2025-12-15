import { Router } from "express";
import { MenuController } from "./menu.controller";

const router = Router();
const controller = new MenuController();

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
