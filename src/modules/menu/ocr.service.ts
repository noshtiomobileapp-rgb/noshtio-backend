// src/modules/menu/ocr.service.ts

import { ImageAnnotatorClient } from "@google-cloud/vision";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import MenuParser from "./menu.parser";

// Load environment variables
const S3_REGION = process.env.AWS_REGION || "";
const S3_BUCKET = process.env.S3_BUCKET || "";

/* ============================================================
   S3 CLIENT INITIALIZATION (Optional)
   ============================================================ */
let s3Client: S3Client | null = null;

if (S3_BUCKET) {
  s3Client = new S3Client({
    region: S3_REGION || "us-east-1",
  });
}

/* ============================================================
   GOOGLE VISION CLIENT
   ============================================================ */
const visionClient = new ImageAnnotatorClient();

/* ============================================================
   Helper: Sanitize filenames for S3
   ============================================================ */
function sanitizeFilename(name: string = ""): string {
  return name.replace(/[^\w\d.\-_]/g, "_");
}

/* ============================================================
   Upload Buffer to S3 (if configured)
   ============================================================ */
export async function uploadBufferToS3(
  buffer: Buffer,
  key: string,
  contentType = "application/octet-stream"
): Promise<string | null> {
  if (!s3Client || !S3_BUCKET) return null;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: "public-read",
  });

  await s3Client.send(command);

  return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${encodeURIComponent(
    key
  )}`;
}

/* ============================================================
   OCR + Parsing + Optional S3 Upload
   ============================================================ */
export async function handleImageOcrUpload(
  buffer: Buffer,
  originalName: string,
  mimeType: string
) {
  /* ---------------------------------------------
     STEP 1 — GOOGLE VISION OCR
     --------------------------------------------- */
  let rawText = "";

  try {
    const [result] = await visionClient.documentTextDetection({
      image: { content: buffer },
    });

    rawText = result?.fullTextAnnotation?.text || "";
  } catch (error: any) {
    console.error("❌ OCR Error:", error);
    throw new Error("Failed to process OCR text");
  }

  /* ---------------------------------------------
     STEP 2 — PARSE RAW TEXT → MENU VARIANTS
     --------------------------------------------- */
  const parsedVariants = MenuParser.parseTextToMenuVariants(rawText);
  const preferred =
    parsedVariants.smart.categories.length > 0
      ? parsedVariants.smart
      : parsedVariants.strict;

  /* ---------------------------------------------
     STEP 3 — UPLOAD IMAGE TO S3 (OPTIONAL)
     --------------------------------------------- */
  let uploadedFileUrl: string | null = null;

  try {
    if (s3Client && S3_BUCKET) {
      const key = `menus/${Date.now()}_${uuidv4()}_${sanitizeFilename(
        originalName
      )}`;
      uploadedFileUrl = await uploadBufferToS3(buffer, key, mimeType);
    }
  } catch (error: any) {
    console.error("❌ S3 Upload Error:", error);
  }

  /* ---------------------------------------------
     STEP 4 — RETURN FORMATTED RESULT
     --------------------------------------------- */
  return {
    success: true,
    uploadedFileUrl,
    rawText,
    parsed: parsedVariants,
    preferred,
  };
}
