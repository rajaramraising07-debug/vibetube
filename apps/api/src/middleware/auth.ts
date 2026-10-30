import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export type AuthRequest = Request & { userId?: string };

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.vibetube_session;
  if (!token) return res.status(401).json({ error: "Please sign in first." });

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) throw new Error("JWT_SECRET must be configured.");
    const payload = jwt.verify(token, secret) as { sub?: string };
    if (!payload.sub) return res.status(401).json({ error: "Invalid session." });
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: "Your session has expired. Please sign in again." });
  }
}
