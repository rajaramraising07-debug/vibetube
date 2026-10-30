"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bell, Compass, Flame, Gamepad2, Home, Menu, Music2, Play,
  Plus, Search, Sparkles, X, GraduationCap
} from "lucide-react";

type Video = {
  id: string;
  title: string;
  creator: string;
  views: string;
  age: string;
  category: string;
  duration: string;
  emoji: string;
  theme: string;
  thumbnailUrl?: string;
  externalUrl?: string;
};

const demoVideos: Video[] = [
  { id: "1", title: "A little reminder to enjoy the journey", creator: "Mellow Frames", views: "245K views", age: "2 days ago", category: "Lifestyle", duration: "12:45", emoji: "🌅", theme: "sunset" },
  { id: "2", title: "The desk setup that changed how I work", creator: "Pixel & Code", views: "128K views", age: "1 day ago", category: "Technology", duration: "18:32", emoji: "💻", theme: "blue" },
  { id: "3", title: "Late night sounds for deep focus", creator: "Soft Signals", views: "1.2M views", age: "5 days ago", category: "Music", duration: "45:10", emoji: "🎧", theme: "pink" },
  { id: "4", title: "An open-world adventure worth getting lost in", creator: "Playstate", views: "89K views", age: "3 days ago", category: "Gaming", duration: "24:18", emoji: "🎮", theme: "green" },
  { id: "5", title: "Build your first idea into a real product", creator: "The Launch Lab", views: "320K views", age: "1 week ago", category: "Education", duration: "16:40", emoji: "🚀", theme: "orange" },
  { id: "6", title: "Quiet places that make you feel alive", creator: "Earth Window", views: "560K views", age: "4 days ago", category: "Lifestyle", duration: "10:25", emoji: "🏞️", theme: "teal" },
  { id: "7", title: "JavaScript concepts made beautifully simple", creator: "Dev Snacks", views: "750K views", age: "2 weeks ago", category: "Technology", duration: "59:20", emoji: "⚡", theme: "blue" },
  { id: "8", title: "A collection of sounds for slow mornings", creator: "Sunday Stereo", views: "980K views", age: "6 days ago", category: "Music", duration: "32:15", emoji: "🎵", theme: "pink" }
];

const categories = ["All", "Eporner", "Music", "Gaming", "Technology", "Education", "Lifestyle"];
const epornerResources = [
  ["Contact / support", "https://www.eporner.com/contact/"],
  ["Advertisement", "https://www.eporner.com/advertisement/"],
  ["FAQ", "https://www.eporner.com/faq/"],
  ["Parental control", "https://www.eporner.com/parentalcontrol/"],
  ["Terms of use", "https://www.eporner.com/terms/"],
  ["Privacy Policy", "https://www.eporner.com/privacy/"],
  ["Cookie Policy", "https://www.eporner.com/cookies/"],
  ["2257 Statement", "https://www.eporner.com/statement2257/"],
  ["DMCA / Copyright Claims", "https://www.eporner.com/dmca/"],
  ["Content Removal", "https://www.eporner.com/content-removal/"],
  ["EU DSA", "https://www.eporner.com/eu-dsa/"],
  ["Law Enforcement", "https://www.eporner.com/law-enforcement/"],
  ["API for webmasters", "https://www.eporner.com/api/v2/"],
  ["RSS Feed", "https://www.eporner.com/feed.rss"]
];

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [menuOpen, setMenuOpen] = useState(false);
  const [videos, setVideos] = useState<Video[]>(demoVideos);
  const [loadingVideos, setLoadingVideos] = useState(true);

  function exploreVideos(nextCategory = "All") {
    setCategory(nextCategory);
    setQuery("");
    setMenuOpen(false);
    window.requestAnimationFrame(() => {
      document.getElementById("videos")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  useEffect(() => {
    Promise.allSettled([
      fetch("/api/videos", { credentials: "include" }).then((response) => response.ok ? response.json() : { videos: [] }),
      fetch("/api/external-videos", { credentials: "include" }).then((response) => response.ok ? response.json() : { videos: [] })
    ]).then(([savedResult, externalResult]) => {
        const saved = savedResult.status === "fulfilled" ? savedResult.value.videos || [] : [];
        const external = externalResult.status === "fulfilled" ? externalResult.value.videos || [] : [];
        const liveVideos: Video[] = saved.map((v: any) => ({
          id: v.id,
          title: v.title,
          creator: v.creator?.displayName || v.creator?.username || "VibeTube Creator",
          views: `${Number(v.views || 0).toLocaleString()} views`,
          age: v.publishedAt ? new Date(v.publishedAt).toLocaleDateString() : "Recently",
          category: v.category || "Other",
          duration: v.duration ? `${Math.floor(v.duration / 60)}:${String(v.duration % 60).padStart(2, "0")}` : "Video",
          emoji: "▶",
          theme: "blue"
        }));
        const externalVideos: Video[] = external.map((v: any) => ({
          id: v.id,
          title: v.title,
          creator: v.creator || "Eporner",
          views: `${Number(v.views || 0).toLocaleString()} views`,
          age: "External",
          category: "Adult",
          duration: `${Math.floor(Number(v.duration || 0) / 60)}:${String(Number(v.duration || 0) % 60).padStart(2, "0")}`,
          emoji: "▶",
          theme: "pink",
          thumbnailUrl: v.thumbnailUrl,
          externalUrl: v.externalUrl
        }));
        if (liveVideos.length || externalVideos.length) setVideos([...liveVideos, ...externalVideos]);
      })
      .catch(() => {})
      .finally(() => setLoadingVideos(false));
  }, []);

  const filtered = useMemo(() => videos.filter((video) => {
    const matchesCategory = category === "All" || (category === "Eporner" ? Boolean(video.externalUrl) : video.category === category);
    const haystack = `${video.title} ${video.creator} ${video.category}`.toLowerCase();
    return matchesCategory && haystack.includes(query.toLowerCase());
  }), [category, query, videos]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-group">
          <button className="icon-btn mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
          <Link href="/" className="brand">
            <span className="brand-mark" aria-hidden="true"><Play size={21} fill="currentColor" /></span>
            <span className="brand-word">vibe<span>tube</span></span>
          </Link>
        </div>

        <label className="searchbar">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search videos, creators..." />
          {query && <button onClick={() => setQuery("")} aria-label="Clear search"><X size={16} /></button>}
        </label>

        <div className="top-actions">
          <Link className="create-btn" href="/studio"><Plus size={18} /> <span>Create</span></Link>
          <button className="icon-btn" aria-label="Notifications"><Bell size={20} /></button>
          <Link href="/account" className="profile-dot" aria-label="Sign in or create account">R</Link>
        </div>
      </header>

      <div className="layout">
        <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
          <nav className="side-nav">
            <Link className="side-link active" href="/"><Home size={19} /> Home</Link>
            <button className="side-link" onClick={() => exploreVideos()}><Compass size={19} /> Explore</button>
            <button className={`side-link ${category === "Eporner" ? "active" : ""}`} onClick={() => exploreVideos("Eporner")}><Play size={19} /> Eporner</button>
          </nav>
          <div className="side-divider" />
          <p className="side-label">CATEGORIES</p>
          <button className={`side-link ${category === "Music" ? "active" : ""}`} onClick={() => exploreVideos("Music")}><Music2 size={19} /> Music</button>
          <button className={`side-link ${category === "Gaming" ? "active" : ""}`} onClick={() => exploreVideos("Gaming")}><Gamepad2 size={19} /> Gaming</button>
          <button className={`side-link ${category === "Education" ? "active" : ""}`} onClick={() => exploreVideos("Education")}><GraduationCap size={19} /> Learning</button>
          <div className="sidebar-note">
            <Sparkles size={20} />
            <strong>Find your vibe.</strong>
            <p>A place for fresh ideas, new creators and videos worth sharing.</p>
          </div>
          <p className="side-foot">About · Privacy · Terms<br />© 2026 VibeTube</p>
        </aside>

        <section className="content">
          <section className="hero">
            <div className="hero-copy">
              <span className="eyebrow"><Sparkles size={14} /> YOUR WORLD, YOUR VIBE</span>
              <h1>Good videos.<br /><em>Good energy.</em></h1>
              <p>Watch what you love. Discover creators. Share what inspires you.</p>
              <button className="hero-btn" onClick={() => exploreVideos()}>
                Explore videos <Play size={15} fill="currentColor" />
              </button>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="hero-orbit orbit-one" />
              <div className="hero-orbit orbit-two" />
              <div className="peach-sticker">🍑</div>
              <span className="spark spark-a">✦</span><span className="spark spark-b">✧</span>
            </div>
          </section>

          <div className="category-strip" id="videos">
            {categories.map((item) => (
              <button key={item} onClick={() => setCategory(item === "Eporner" ? "Eporner" : item)} className={`category-pill ${category === item ? "selected" : ""}`}>{item}</button>
            ))}
          </div>

          <div className="section-head">
            <div><span className="section-kicker"><Flame size={15} /> PICKED FOR YOU</span><h2>{query ? "Search results" : category === "All" ? "Trending right now" : category}</h2></div>
            <span className="result-count">{loadingVideos ? "Loading…" : `${filtered.length} videos`}</span>
          </div>

          {filtered.length ? (
            <div className="video-grid">
              {filtered.map((video) => (
                <article className="video-card" key={video.id}>
                  <a href={video.externalUrl || `/watch/${video.id}`} target={video.externalUrl ? "_blank" : undefined} rel={video.externalUrl ? "noopener noreferrer nofollow" : undefined} className={`thumbnail thumb-${video.theme}`} style={video.thumbnailUrl ? { backgroundImage: `linear-gradient(#0001,#0004), url("${video.thumbnailUrl}")` } : undefined}>
                    <span className="thumb-emoji">{video.emoji}</span>
                    <span className="play-hover"><Play size={21} fill="white" /></span>
                    <span className="duration">{video.duration}</span>
                  </a>
                  <div className="video-meta">
                    <div className="creator-avatar">{video.creator.slice(0, 1)}</div>
                    <div className="video-copy">
                      <a href={video.externalUrl || `/watch/${video.id}`} target={video.externalUrl ? "_blank" : undefined} rel={video.externalUrl ? "noopener noreferrer nofollow" : undefined} className="video-title">{video.title}</a>
                      <p>{video.creator}</p><small>{video.views} · {video.age}</small>
                    </div>
                    <button className="more-btn" aria-label={`More options for ${video.title}`}>⋮</button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state"><Search size={30} /><h3>No videos found</h3><p>Try another search or category.</p><button onClick={() => { setQuery(""); setCategory("All"); }}>Clear filters</button></div>
          )}

          <footer className="footer">Made for creators. Built for discovery. <span>✦</span> VibeTube</footer>
          <nav className="source-resources" aria-label="Eporner resources">
            <h2>Eporner resources</h2>
            <p>These links go to Eporner. Its policies and support apply to its service.</p>
            <div className="source-resource-links">
              {epornerResources.map(([label, href]) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer nofollow">{label}</a>
              ))}
            </div>
          </nav>
        </section>
      </div>

      <nav className="mobile-nav">
        <Link href="/"><Home size={20} /><span>Home</span></Link>
        <button onClick={() => exploreVideos()}><Compass size={20} /><span>Explore</span></button>
        <Link href="/studio"><Plus size={22} /><span>Create</span></Link>
        <button onClick={() => exploreVideos("Eporner")}><Play size={20} /><span>Eporner</span></button>
        <Link href="/studio"><span className="mobile-avatar">R</span><span>You</span></Link>
      </nav>
    </main>
  );
}
