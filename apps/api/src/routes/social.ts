import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/subscriptions/:creatorId", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const creatorId = req.params.creatorId as string;
    const subscription = await prisma.subscription.findUnique({
      where: { subscriberId_creatorId: { subscriberId: req.userId!, creatorId } }
    });
    res.json({ subscribed: Boolean(subscription) });
  } catch (error) { next(error); }
});

router.post("/subscriptions/:creatorId", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const creatorId = req.params.creatorId as string;
    if (req.userId === creatorId) return res.status(400).json({ error: "You cannot subscribe to your own channel." });
    await prisma.subscription.createMany({
      data: [{ subscriberId: req.userId!, creatorId }],
      skipDuplicates: true
    });
    const count = await prisma.subscription.count({ where: { creatorId } });
    res.json({ subscribed: true, subscribers: count });
  } catch (error) { next(error); }
});

router.delete("/subscriptions/:creatorId", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const creatorId = req.params.creatorId as string;
    await prisma.subscription.deleteMany({ where: { subscriberId: req.userId!, creatorId } });
    const count = await prisma.subscription.count({ where: { creatorId } });
    res.json({ subscribed: false, subscribers: count });
  } catch (error) { next(error); }
});

router.get("/channels/:username", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: req.params.username.toLowerCase() },
      select: {
        id: true, username: true, displayName: true, bio: true, avatarUrl: true, createdAt: true,
        _count: { select: { videos: true, subscribers: true } },
        videos: { where: { status: "READY", visibility: "PUBLIC" }, orderBy: { publishedAt: "desc" }, take: 30,
          select: { id: true, title: true, thumbnailUrl: true, views: true, publishedAt: true } }
      }
    });
    if (!user) return res.status(404).json({ error: "Channel not found." });
    res.json({ channel: user });
  } catch (error) { next(error); }
});

router.get("/studio/videos", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const videos = await prisma.video.findMany({
      where: { creatorId: req.userId }, orderBy: { createdAt: "desc" },
      select: { id: true, title: true, status: true, views: true, thumbnailUrl: true, createdAt: true, publishedAt: true }
    });
    res.json({ videos });
  } catch (error) { next(error); }
});

export default router;
