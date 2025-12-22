// src/modules/menu/ocr.service.ts

import { ImageAnnotatorClient } from "@google-cloud/vision";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import MenuParser from "./menu.parser";

/* ============================================================
   Environment
   ============================================================ */

const S3_REGION = process.env.AWS_REGION || "";
const S3_BUCKET = process.env.S3_BUCKET || "";

/* ============================================================
   Google Vision Client
   ============================================================ */

const visionClient = new ImageAnnotatorClient();

/* ============================================================
   Optional S3 Client
   ============================================================ */

let s3Client: S3Client | null = null;

if (S3_BUCKET) {
  s3Client = new S3Client({
    region: S3_REGION || "us-east-1",
  });
}

/* ============================================================
   Helpers
   ============================================================ */

function sanitizeFilename(name: string = ""): string {
  return name.replace(/[^\w\d.\-_]/g, "_");
}

async function uploadBufferToS3(
  buffer: Buffer,
  key: string,
  contentType: string
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
   OCR + HARDENED PARSING + OPTIONAL UPLOAD
   ============================================================ */

export async function handleImageOcrUpload(
  buffer: Buffer,
  originalName: string,
  mimeType: string
) {
  /* ---------------------------------------------
     STEP 1 — OCR (RAW TEXT ONLY)
     --------------------------------------------- */
  let rawText = "";

  try {
    const [result] = await visionClient.documentTextDetection({
      image: { content: buffer },
    });

    rawText = result?.fullTextAnnotation?.text || "";
  } catch (error) {
    console.error("❌ OCR Error:", error);
    throw new Error("Failed to process OCR text");
  }

  /* ---------------------------------------------
     STEP 2 — PARSE + HARDEN (STEP 3)
     --------------------------------------------- */
  const menu = MenuParser.parseTextToMenu(rawText);
  // menu is now:
  // Array<{ category: string; items: { name: string; price: number | null }[] }>

  /* ---------------------------------------------
     STEP 3 — OPTIONAL IMAGE UPLOAD
     --------------------------------------------- */
  let uploadedFileUrl: string | null = null;

  try {
    if (s3Client && S3_BUCKET) {
      const key = `menus/${Date.now()}_${uuidv4()}_${sanitizeFilename(
        originalName
      )}`;
      uploadedFileUrl = await uploadBufferToS3(buffer, key, mimeType);
    }
  } catch (error) {
    console.error("❌ S3 Upload Error:", error);
  }

  /* ---------------------------------------------
     STEP 4 — RETURN FRONTEND-SAFE RESULT
     --------------------------------------------- */
  return {
    success: true,
    uploadedFileUrl,
    rawText,
    menu, // ✅ HARDENED OUTPUT ONLY
  };
}
