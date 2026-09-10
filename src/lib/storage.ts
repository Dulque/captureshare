import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';

const isS3Configured = Boolean(
  process.env.S3_ACCESS_KEY_ID &&
  process.env.S3_SECRET_ACCESS_KEY &&
  process.env.S3_BUCKET
);

const s3Client = isS3Configured
  ? new S3Client({
      region: process.env.S3_REGION || 'auto',
      endpoint: process.env.S3_ENDPOINT || undefined,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
      forcePathStyle: true,
    })
  : null;

const BUCKET_NAME = process.env.S3_BUCKET || 'trizen-photos';
const LOCAL_UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure local upload dir exists when running in local fallback mode
if (!isS3Configured) {
  if (!fs.existsSync(LOCAL_UPLOAD_DIR)) {
    try {
      fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
    } catch {
      // Ignore if cannot create synchronously
    }
  }
}

export interface PresignedUploadResult {
  uploadUrl: string;
  storageKey: string;
  publicUrl: string;
  isDirectS3: boolean;
}

/**
 * Generates an upload target (Presigned S3 PUT URL or Local Direct Upload API URL)
 */
export async function getUploadUrl(
  eventId: string,
  filename: string,
  mimeType: string
): Promise<PresignedUploadResult> {
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniqueKey = `events/${eventId}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${sanitizedFilename}`;

  if (isS3Configured && s3Client) {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueKey,
      ContentType: mimeType,
    });

    // 15-minute presigned upload URL
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

    const publicUrl = process.env.S3_PUBLIC_DOMAIN
      ? `${process.env.S3_PUBLIC_DOMAIN.replace(/\/$/, '')}/${uniqueKey}`
      : uploadUrl.split('?')[0];

    return {
      uploadUrl,
      storageKey: uniqueKey,
      publicUrl,
      isDirectS3: true,
    };
  }

  // Local fallback: client POSTs to local API endpoint /api/storage/upload
  return {
    uploadUrl: `/api/events/${eventId}/photos/upload-direct?key=${encodeURIComponent(uniqueKey)}`,
    storageKey: uniqueKey,
    publicUrl: `/api/storage/${uniqueKey}`,
    isDirectS3: false,
  };
}

/**
 * Save file locally (for local development fallback)
 */
export async function saveLocalFile(storageKey: string, buffer: Buffer): Promise<string> {
  const filePath = path.join(LOCAL_UPLOAD_DIR, storageKey);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  await fs.promises.writeFile(filePath, buffer);
  return `/api/storage/${storageKey}`;
}

/**
 * Read file from local fallback
 */
export async function getLocalFile(storageKey: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  const filePath = path.join(LOCAL_UPLOAD_DIR, storageKey);
  if (!fs.existsSync(filePath)) return null;

  const buffer = await fs.promises.readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  let contentType = 'image/jpeg';
  if (ext === '.png') contentType = 'image/png';
  else if (ext === '.webp') contentType = 'image/webp';
  else if (ext === '.gif') contentType = 'image/gif';
  else if (ext === '.svg') contentType = 'image/svg+xml';

  return { buffer, contentType };
}

/**
 * Delete a photo from storage
 */
export async function deleteFile(storageKey: string): Promise<void> {
  if (isS3Configured && s3Client) {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: storageKey,
      })
    );
  } else {
    const filePath = path.join(LOCAL_UPLOAD_DIR, storageKey);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath).catch(() => {});
    }
  }
}
