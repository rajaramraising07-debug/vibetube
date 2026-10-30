import { Router } from "express";
import jwt from "jsonwebtoken";
import { AGE_COOKIE, AGE_DENIED_COOKIE, isAgeDenied, isAgeVerified } from "../middleware/age.js";

const router = Router();
const AGE_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: AGE_COOKIE_MAX_AGE
  };
}

router.get("/status", (req, res) => {
  res.json({ verified: isAgeVerified(req), denied: isAgeDenied(req) });
});

router.post("/confirm", (req, res) => {
  if (req.body?.over18 !== true) {
    return res.status(403).json({ error: "You must confirm that you are 18 or older." });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    return res.status(503).json({ error: "Age confirmation is temporarily unavailable." });
  }

  const token = jwt.sign({ ageVerified: true }, secret, {
    subject: "age-gate",
    issuer: "vibetube",
    expiresIn: "30d"
  });
  res.cookie(AGE_COOKIE, token, cookieOptions());
  res.clearCookie(AGE_DENIED_COOKIE, { ...cookieOptions(), maxAge: undefined });
  res.json({ verified: true });
});

router.post("/decline", (_req, res) => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    return res.status(503).json({ error: "Age confirmation is temporarily unavailable." });
  }

  const token = jwt.sign({ ageDenied: true }, secret, {
    subject: "age-gate",
    issuer: "vibetube",
    expiresIn: "30d"
  });
  res.clearCookie(AGE_COOKIE, { ...cookieOptions(), maxAge: undefined });
  res.cookie(AGE_DENIED_COOKIE, token, cookieOptions());
  res.json({ denied: true });
});

export default router;
