import { Router } from "express";
import { randomUUID } from "crypto";
import { createWriteStream } from "node:fs";
import { access, mkdir, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import { r2, r2Ready } from "../lib/r2.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();
const MAX_VIDEO_BYTES = 500 * 1024 * 1024;
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const LOCAL_VIDEO_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../../.local-uploads");
const LOCAL_FILE_ID = /^[a-f0-9-]{36}\.(mp4|webm|mov)$/i;
const localStorageEnabled = process.env.NODE_ENV !== "production" && !r2Ready;

function extensionFor(contentType: string) {
  return contentType === "video/quicktime" ? "mov" : contentType.split("/")[1];
}

router.post("/video-url", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const parsed = z.object({
      filename: z.string().min(1).max(180),
      contentType: z.enum(["video/mp4", "video/webm", "video/quicktime"]),
      size: z.number().int().positive().max(MAX_VIDEO_BYTES)
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Choose an MP4, WebM or MOV video smaller than 500 MB." });

    const ext = extensionFor(parsed.data.contentType);
    if (!r2Ready || !r2) {
      if (!localStorageEnabled) return res.status(503).json({ error: "Video storage is not configured yet. Add the R2 environment variables." });
      const fileId = `${randomUUID()}.${ext}`;
      const localUrl = `/api/uploads/local/${fileId}`;
      return res.json({ uploadUrl: localUrl, key: fileId, publicUrl: localUrl, storage: "local" });
    }

    const key = `videos/${req.userId}/${randomUUID()}.${ext}`;
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      ContentType: parsed.data.contentType,
      ContentLength: parsed.data.size
    });
    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 600 });
    res.json({ uploadUrl, key, publicUrl: `${process.env.R2_PUBLIC_BASE_URL!.replace(/\/$/, "")}/${key}` });
  } catch (error) { next(error); }
});

router.put("/local/:fileId", requireAuth, async (req: AuthRequest, res, next) => {
  const fileId = typeof req.params.fileId === "string" ? req.params.fileId : "";
  if (!localStorageEnabled) return res.status(404).json({ error: "Local video storage is only available in development without R2." });
  if (!LOCAL_FILE_ID.test(fileId)) return res.status(400).json({ error: "Invalid local video identifier." });

  const contentType = req.get("content-type")?.split(";")[0].trim();
  if (!contentType || !VIDEO_TYPES.includes(contentType)) return res.status(415).json({ error: "Choose an MP4, WebM or MOV video." });
  if (extensionFor(contentType) !== fileId.split(".").pop()) return res.status(400).json({ error: "Video type does not match the upload URL." });

  const declaredSize = Number(req.get("content-length"));
  if (Number.isFinite(declaredSize) && declaredSize > MAX_VIDEO_BYTES) return res.status(413).json({ error: "Maximum video size is 500 MB." });

  const filePath = join(LOCAL_VIDEO_DIR, fileId);
  let size = 0;
  const sizeLimit = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      size += chunk.length;
      if (size > MAX_VIDEO_BYTES) callback(Object.assign(new Error("Maximum video size is 500 MB."), { statusCode: 413 }));
      else callback(null, chunk);
    }
  });

  try {
    await mkdir(LOCAL_VIDEO_DIR, { recursive: true });
    await pipeline(req, sizeLimit, createWriteStream(filePath, { flags: "wx" }));
    if (size === 0) {
      await rm(filePath, { force: true });
      return res.status(400).json({ error: "The uploaded video was empty." });
    }
    res.status(204).end();
  } catch (error) {
    await rm(filePath, { force: true }).catch(() => undefined);
    if (error && typeof error === "object" && "statusCode" in error && error.statusCode === 413) {
      return res.status(413).json({ error: "Maximum video size is 500 MB." });
    }
    next(error);
  }
});

router.get("/local/:fileId", async (req, res, next) => {
  const fileId = typeof req.params.fileId === "string" ? req.params.fileId : "";
  if (!localStorageEnabled || !LOCAL_FILE_ID.test(fileId)) return res.status(404).json({ error: "Video not found." });

  const filePath = join(LOCAL_VIDEO_DIR, fileId);
  try {
    await access(filePath);
    res.type(fileId.endsWith(".webm") ? "video/webm" : fileId.endsWith(".mov") ? "video/quicktime" : "video/mp4");
    res.sendFile(filePath, error => { if (error) next(error); });
  } catch {
    res.status(404).json({ error: "Video not found." });
  }
});

export default router;
