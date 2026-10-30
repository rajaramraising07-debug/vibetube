import { Router } from "express";

const router = Router();
const API_URL = "https://www.eporner.com/api/v2/video/search/";
const underageCoded = /\b(?:teen(?:s|age|aged)?|underage|under[\s-]?18|minor|schoolgirl|schoolboy|young\s+(?:girl|boy)|barely\s+legal|jailbait|loli|shota|preteen|child|kids?)\b/i;
const safeId = /^[A-Za-z0-9_-]{4,40}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function safeHttpsUrl(value: unknown, allowedHost: (host: string) => boolean) {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && allowedHost(url.hostname) ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

router.get("/", async (req, res) => {
  const page = Math.max(1, Math.min(100, Number.parseInt(String(req.query.page ?? "1"), 10) || 1));
  const params = new URLSearchParams({
    query: "all",
    per_page: "20",
    page: String(page),
    order: "most-popular",
    format: "json"
  });

  try {
    const response = await fetch(`${API_URL}?${params}`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(10_000)
    });
    if (!response.ok) return res.status(502).json({ error: "The external video source is unavailable." });

    const payload: unknown = await response.json();
    const items = isRecord(payload) && Array.isArray(payload.videos) ? payload.videos : [];
    const videos = items.flatMap((item) => {
      if (!isRecord(item)) return [];
      const id = item.id;
      const title = item.title;
      const keywords = typeof item.keywords === "string" ? item.keywords : "";
      if (typeof id !== "string" || !safeId.test(id) || typeof title !== "string" || underageCoded.test(`${title} ${keywords}`)) return [];

      const thumb = isRecord(item.default_thumb) ? item.default_thumb.src : undefined;
      const thumbnailUrl = safeHttpsUrl(thumb, (host) => host === "eporner.com" || host.endsWith(".eporner.com"));
      const watchUrl = safeHttpsUrl(item.url, (host) => host === "www.eporner.com");
      const embedUrl = safeHttpsUrl(item.embed, (host) => host === "www.eporner.com");
      if (!thumbnailUrl || !watchUrl || !embedUrl) return [];

      const views = typeof item.views === "number" && Number.isFinite(item.views) ? Math.max(0, item.views) : 0;
      const duration = typeof item.length_sec === "number" && Number.isFinite(item.length_sec) ? Math.max(0, Math.floor(item.length_sec)) : 0;
      const added = typeof item.added === "string" ? item.added.slice(0, 30) : "";

      return [{
        id: `eporner_${id}`,
        title: title.slice(0, 180),
        creator: "Eporner",
        views,
        added,
        duration,
        thumbnailUrl,
        externalUrl: embedUrl,
        source: "Eporner"
      }];
    });

    res.set("Cache-Control", "private, max-age=300").json({ videos });
  } catch {
    res.status(502).json({ error: "Could not load videos from the external source." });
  }
});

export default router;
