import * as Minio from 'minio';
import { env } from '../../config/env';
import { logger } from './logger';

const client = new Minio.Client({
  endPoint: env.MINIO_ENDPOINT,
  port: env.MINIO_PORT,
  useSSL: false,
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY,
});

const BUCKET = env.MINIO_BUCKET;

export async function ensureBucket(): Promise<void> {
  const exists = await client.bucketExists(BUCKET);
  if (!exists) {
    await client.makeBucket(BUCKET);
    logger.info({ bucket: BUCKET }, 'MinIO bucket created');
  }
}

export async function uploadFile(key: string, buffer: Buffer, mimeType: string): Promise<void> {
  await client.putObject(BUCKET, key, buffer, buffer.length, { 'Content-Type': mimeType });
}

export async function getPresignedUrl(key: string, expirySeconds = 3600): Promise<string> {
  return client.presignedGetObject(BUCKET, key, expirySeconds);
}

export async function deleteFile(key: string): Promise<void> {
  await client.removeObject(BUCKET, key);
}
