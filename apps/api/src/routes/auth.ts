import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { rateLimit } from "express-rate-limit";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many failed sign-in attempts. Please wait 15 minutes and try again." }
});
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many accounts created from this connection. Please try again in an hour." }
});
const credentials = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(72)
});
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000
});

function issueSession(userId: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error("Set JWT_SECRET to at least 32 characters.");
  return jwt.sign({}, secret, { subject: userId, expiresIn: "7d", issuer: "vibetube" });
}

router.post("/register", registrationLimiter, async (req, res, next) => {
  try {
    const parsed = credentials.extend({
      username: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/),
      displayName: z.string().trim().min(1).max(60).optional()
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Enter a valid email, username and password (at least 8 characters)." });

    const { email, password, username, displayName } = parsed.data;
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] }
    });
    if (existing) return res.status(409).json({ error: "That email or username is already registered." });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), username: username.toLowerCase(), displayName: displayName || username, passwordHash }
    });
    res.cookie("vibetube_session", issueSession(user.id), cookieOptions());
    res.status(201).json({ user: { id: user.id, username: user.username, displayName: user.displayName } });
  } catch (error) { next(error); }
});

router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const parsed = credentials.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Enter a valid email and password." });
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }
    res.cookie("vibetube_session", issueSession(user.id), cookieOptions());
    res.json({ user: { id: user.id, username: user.username, displayName: user.displayName } });
  } catch (error) { next(error); }
});

router.post("/logout", (_req, res) => {
  res.clearCookie("vibetube_session", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
  res.status(204).end();
});

router.get("/me", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, username: true, displayName: true, bio: true, avatarUrl: true, createdAt: true }
    });
    if (!user) return res.status(401).json({ error: "Account not found." });
    res.json({ user });
  } catch (error) { next(error); }
});

export default router;
