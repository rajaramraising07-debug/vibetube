import { S3Client } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

export const r2Ready = Boolean(accountId && accessKeyId && secretAccessKey && process.env.R2_BUCKET_NAME && process.env.R2_PUBLIC_BASE_URL);

export const r2 = r2Ready ? new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! }
}) : null;
