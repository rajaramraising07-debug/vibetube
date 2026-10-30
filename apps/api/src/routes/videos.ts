import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();
const watchableVideoWhere = { status: "READY" as const, visibility: { in: ["PUBLIC" as const, "UNLISTED" as const] } };
const videoSelect = {
  id: true, title: true, description: true, category: true, tags: true,
  thumbnailUrl: true, streamUid: true, duration: true, status: true,
  visibility: true, views: true, publishedAt: true, createdAt: true,
  creator: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
  _count: { select: { likes: true, comments: true } }
} as const;

router.get("/categories", (_req, res) => res.json({
  categories: ["Music", "Gaming", "Technology", "Education", "Lifestyle", "Entertainment", "Sports", "Other"]
}));

router.get("/", async (req, res, next) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    const videos = await prisma.video.findMany({
      where: {
        status: "READY", visibility: "PUBLIC",
        ...(category && category !== "All" ? { category } : {}),
        ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }, { tags: { has: q.toLowerCase() } }] } : {})
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 40, select: videoSelect
    });
    res.json({ videos });
  } catch (error) { next(error); }
});

router.post("/", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const parsed = z.object({
      title: z.string().trim().min(3).max(120),
      description: z.string().max(5000).default(""),
      category: z.string().max(40).default("Other"),
      tags: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
      videoUrl: z.string().url(),
      thumbnailUrl: z.string().url().optional(),
      duration: z.number().int().positive().max(86400).optional()
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Check the title, description and uploaded video details." });

    const video = await prisma.video.create({
      data: {
        title: parsed.data.title, description: parsed.data.description,
        category: parsed.data.category, tags: parsed.data.tags.map(t => t.toLowerCase()),
        streamUid: parsed.data.videoUrl, thumbnailUrl: parsed.data.thumbnailUrl,
        duration: parsed.data.duration, status: "READY", visibility: "PUBLIC",
        publishedAt: new Date(), creatorId: req.userId!
      },
      select: videoSelect
    });
    res.status(201).json({ video });
  } catch (error) { next(error); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const video = await prisma.video.findFirst({
      where: { id: req.params.id, status: "READY", visibility: { in: ["PUBLIC", "UNLISTED"] } },
      select: videoSelect
    });
    if (!video) return res.status(404).json({ error: "Video not found." });
    res.json({ video });
  } catch (error) { next(error); }
});

router.post("/:id/like", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const videoId = req.params.id as string;
    const video = await prisma.video.findFirst({ where: { id: videoId, ...watchableVideoWhere }, select: { id: true } });
    if (!video) return res.status(404).json({ error: "Video not found." });
    const existing = await prisma.like.findUnique({ where: { userId_videoId: { userId: req.userId!, videoId: video.id } } });
    if (existing) await prisma.like.delete({ where: { id: existing.id } });
    else await prisma.like.create({ data: { userId: req.userId!, videoId: video.id } });
    const likes = await prisma.like.count({ where: { videoId: video.id } });
    res.json({ liked: !existing, likes });
  } catch (error) { next(error); }
});

router.get("/:id/comments", async (req, res, next) => {
  try {
    const videoId = req.params.id as string;
    const video = await prisma.video.findFirst({ where: { id: videoId, ...watchableVideoWhere }, select: { id: true } });
    if (!video) return res.status(404).json({ error: "Video not found." });
    const comments = await prisma.comment.findMany({
      where: { videoId },
      orderBy: { createdAt: "desc" }, take: 100,
      select: { id: true, body: true, createdAt: true, user: { select: { username: true, displayName: true, avatarUrl: true } } }
    });
    res.json({ comments });
  } catch (error) { next(error); }
});

router.post("/:id/comments", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const videoId = req.params.id as string;
    const parsed = z.object({ body: z.string().trim().min(1).max(2000) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Comment must be between 1 and 2,000 characters." });
    const video = await prisma.video.findFirst({ where: { id: videoId, ...watchableVideoWhere }, select: { id: true } });
    if (!video) return res.status(404).json({ error: "Video not found." });
    const comment = await prisma.comment.create({
      data: { body: parsed.data.body, videoId, userId: req.userId! },
      select: { id: true, body: true, createdAt: true, user: { select: { username: true, displayName: true, avatarUrl: true } } }
    });
    res.status(201).json({ comment });
  } catch (error) { next(error); }
});

router.post("/:id/view", async (req, res, next) => {
  try {
    const updated = await prisma.video.updateMany({
      where: { id: req.params.id, ...watchableVideoWhere },
      data: { views: { increment: 1 } }
    });
    if (updated.count === 0) return res.status(404).json({ error: "Video not found." });
    const video = await prisma.video.findUnique({ where: { id: req.params.id }, select: { views: true } });
    if (!video) return res.status(404).json({ error: "Video not found." });
    res.json({ views: video.views });
  } catch (error) { next(error); }
});

export default router;
