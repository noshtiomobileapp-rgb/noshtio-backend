// src/modules/menu/index.ts
import * as menuModule from "./menu.routes";

// support both ES module default and CommonJS exports
const router = (menuModule as any).default ?? menuModule;

export default router;
