import { Router } from "express";

const router = Router();
const API_URL = "https://www.eporner.com/api/v2/video/search/";
const categoryQueries: Record<string, string> = {
  All: "all",
  Eporner: "all",
  Amateur: "amateur",
  Asian: "asian",
  ASMR: "asmr",
  BDSM: "bdsm",
  "Big Ass": "big ass",
  "Big Dick": "big dick",
  "Big Tits": "big tits",
  Cosplay: "cosplay",
  Creampie: "creampie",
  Cuckold: "cuckold",
  Ebony: "ebony",
  Footjob: "footjob",
  "Group Sex": "group sex",
  Hardcore: "hardcore",
  Homemade: "homemade",
  Indonesia: "indonesia",
  Interracial: "interracial",
  Latina: "latina",
  Massage: "massage",
  Mature: "mature",
  Orgy: "orgy",
  Redhead: "redhead",
  "Solo girls": "solo girls",
  Threesome: "threesome",
  Vintage: "vintage",
  Japanese: "japanese",
  Anal: "anal",
  POV: "pov",
  Indian: "indian",
  MILF: "milf",
  BBW: "bbw",
  Pinay: "pinay",
  Gay: "gay",
  Lesbian: "lesbian",
  Transgender: "transgender",
  "4K Ultra HD": "4k",
  "HD 1080p": "1080p",
  "60 FPS": "60 fps",
  "VR Porn": "vr"
};
const underageCoded = /\b(?:teen(?:s|age|aged)?|underage|under[\s-]?18|minor|school(?:girl|boy|kid)?s?|student(?:s)?|young|barely\s+legal|jailbait|loli|shota|preteen|child(?:ren)?|kids?|daughter(?:s)?|son(?:s)?|step[\s-]?(?:daughter|son|mom|mother|sister|brother))\b/i;
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
  const category = String(req.query.category ?? "All");
  const categoryQuery = categoryQueries[category];
  if (!categoryQuery) return res.status(400).json({ error: "Unsupported video category." });
  const search = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
  const query = [categoryQuery === "all" ? "" : categoryQuery, search].filter(Boolean).join(" ") || "all";
  const params = new URLSearchParams({
    query,
    per_page: "30",
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
    const totalPages = isRecord(payload) && typeof payload.total_pages === "number" && Number.isFinite(payload.total_pages)
      ? Math.max(1, Math.floor(payload.total_pages))
      : page;
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
        category: category === "All" || category === "Eporner" ? "Eporner" : category,
        views,
        added,
        duration,
        thumbnailUrl,
        externalUrl: embedUrl,
        source: "Eporner"
      }];
    });

    res.set("Cache-Control", "private, max-age=300").json({ videos, page, totalPages, hasMore: page < totalPages });
  } catch {
    res.status(502).json({ error: "Could not load videos from the external source." });
  }
});

export default router;
