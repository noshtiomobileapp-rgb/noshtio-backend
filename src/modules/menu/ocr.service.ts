import { ImageAnnotatorClient } from "@google-cloud/vision";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

/* ============================================================
   ENV
============================================================ */
const S3_REGION = process.env.AWS_REGION || "";
const S3_BUCKET = process.env.S3_BUCKET || "";

/* ============================================================
   CLIENTS
============================================================ */
const visionClient = new ImageAnnotatorClient();

const s3Client =
  S3_BUCKET && S3_REGION
    ? new S3Client({ region: S3_REGION })
    : null;

/* ============================================================
   HELPERS
============================================================ */
function sanitizeFilename(name = "") {
  return name.replace(/[^\w\d.\-_]/g, "_");
}

async function uploadToS3(
  buffer: Buffer,
  key: string,
  contentType: string
) {
  if (!s3Client || !S3_BUCKET) return null;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: "public-read",
    })
  );

  return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
}

/* ============================================================
   OCR SERVICE (RAW TEXT CONTRACT — STABLE)
============================================================ */
export async function handleImageOcrUpload(
  buffer: Buffer,
  originalName: string,
  mimeType: string
) {
  let rawText = "";

  try {
    const [result] =
      await visionClient.documentTextDetection({
        image: { content: buffer },
      });

    rawText = result?.fullTextAnnotation?.text || "";
  } catch (err) {
    console.error("OCR ERROR:", err);
    throw new Error("Failed to extract text from menu image");
  }

  let uploadedFileUrl: string | null = null;

  try {
    if (s3Client) {
      const key = `menus/${Date.now()}_${uuidv4()}_${sanitizeFilename(
        originalName
      )}`;
      uploadedFileUrl = await uploadToS3(
        buffer,
        key,
        mimeType
      );
    }
  } catch (err) {
    console.error("S3 UPLOAD ERROR:", err);
  }

  return {
    rawText,
    uploadedFileUrl,
  };
}
