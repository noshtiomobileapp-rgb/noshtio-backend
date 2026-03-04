import { Request, Response } from "express";
import MenuDraftSnapshot from "./menu.snapshot.model";

/* ============================================================
   GET DRAFT SNAPSHOT BY ID
   READ-ONLY — NO REVIEW / NO COMMIT
============================================================ */
export const getDraftSnapshot = async (
  req: Request,
  res: Response
) => {
  try {
    const { snapshotId } = req.params;

    if (!snapshotId) {
      return res.status(400).json({
        success: false,
        message: "Snapshot ID is required",
      });
    }

    const snapshot = await MenuDraftSnapshot.findById(snapshotId);

    if (!snapshot) {
      return res.status(404).json({
        success: false,
        message: "Draft snapshot not found",
      });
    }

    const items =
      snapshot.mapping?.flatMap((category: any) => category.items || []) ?? [];

    return res.status(200).json({
      success: true,
      snapshotId: snapshot._id,
      status: snapshot.status,
      items,
    });
  } catch (error: any) {
    console.error("GET DRAFT SNAPSHOT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to load draft snapshot",
    });
  }
};
