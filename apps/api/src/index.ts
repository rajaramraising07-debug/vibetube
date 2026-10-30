import "dotenv/config";
import { config as loadRootEnv } from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import ageRouter from "./routes/age.js";
import { requireAgeVerified } from "./middleware/age.js";
import authRouter from "./routes/auth.js";
import videosRouter from "./routes/videos.js";
import uploadsRouter from "./routes/uploads.js";
import socialRouter from "./routes/social.js";
import externalVideosRouter from "./routes/external-videos.js";

// Keep API-specific secrets in apps/api/.env, while using the root Neon URL
// when one is configured. Deployment platforms can still inject DATABASE_URL.
const rootEnv = loadRootEnv({ path: "../../.env", processEnv: {} }).parsed;
if (rootEnv?.DATABASE_URL) process.env.DATABASE_URL = rootEnv.DATABASE_URL;

const app = express();
const port = Number(process.env.PORT || process.env.API_PORT || 4000);
const webOrigin = process.env.WEB_ORIGIN || "http://localhost:3000";

app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: webOrigin.split(",").map(v => v.trim()), credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "vibetube-api", timestamp: new Date().toISOString() });
});

app.use("/api/age", ageRouter);
app.use("/api", requireAgeVerified);
app.use("/api/auth", authRouter);
app.use("/api/external-videos", externalVideosRouter);
app.use("/api/videos", videosRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api", socialRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

app.listen(port, () => console.log(`VibeTube API listening on port ${port}`));
