import { S3Client } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
const endpoint = process.env.AWS_ENDPOINT_URL_S3 || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);
const region = process.env.AWS_REGION || (accountId ? "auto" : undefined);
const bucket = process.env.R2_BUCKET_NAME;
export const objectPublicBaseUrl = process.env.R2_PUBLIC_BASE_URL || (endpoint && bucket ? `${endpoint.replace(/\/$/, "")}/${bucket}` : undefined);

export const r2Ready = Boolean(endpoint && region && accessKeyId && secretAccessKey && bucket && objectPublicBaseUrl);

export const r2 = r2Ready ? new S3Client({
  region: region!,
  endpoint: endpoint!,
  forcePathStyle: true,
  credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! }
}) : null;
