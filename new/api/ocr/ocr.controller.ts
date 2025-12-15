import { Request, Response, NextFunction } from "express";
import { OCRService } from "../../domain/ocr/ocr.service";

export class OCRController {
  private service = new OCRService();

  uploadImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "Image file is required" });
      }

      // file.path set by multer
      const result = await this.service.processImage(req.file.path, {
        filename: req.file.filename,
        originalname: req.file.originalname,
      });

      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };
}
