import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const AGE_COOKIE = "vibetube_age_verified";
export const AGE_DENIED_COOKIE = "vibetube_age_denied";

function hasSignedClaim(req: Request, cookieName: string, claim: string) {
  const token = req.cookies?.[cookieName];
  const secret = process.env.JWT_SECRET;
  if (!token || !secret || secret.length < 32) return false;

  try {
    const payload = jwt.verify(token, secret, { issuer: "vibetube" });
    return typeof payload === "object" && payload[claim] === true;
  } catch {
    return false;
  }
}

export function isAgeDenied(req: Request) {
  return hasSignedClaim(req, AGE_DENIED_COOKIE, "ageDenied");
}

export function isAgeVerified(req: Request) {
  return !isAgeDenied(req) && hasSignedClaim(req, AGE_COOKIE, "ageVerified");
}

export function requireAgeVerified(req: Request, res: Response, next: NextFunction) {
  if (!isAgeVerified(req)) {
    return res.status(403).json({ error: "Confirm that you are 18 or older to use VibeTube." });
  }
  next();
}
