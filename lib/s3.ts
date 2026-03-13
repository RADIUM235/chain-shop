import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/*
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error("AWS credentials are not set");
}
*/

export const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy_access_key',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy_secret_key',
  },
});

/**
 * Generate a presigned URL for downloading the ebook from S3.
 * URL expires in 5 minutes (300 seconds).
 */
export async function getPresignedDownloadUrl(s3Key: string): Promise<string> {
  const bucketName = process.env.AWS_BUCKET_NAME;

  if (!bucketName || !s3Key) {
    throw new Error("AWS_BUCKET_NAME or s3Key is not set");
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
    ResponseContentDisposition: 'attachment; filename="' + s3Key.split('/').pop() + '"',
  });

  const presignedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 300, // 5 minutes
  });

  return presignedUrl;
}
