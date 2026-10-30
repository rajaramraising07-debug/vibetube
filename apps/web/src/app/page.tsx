"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bell, Compass, Flame, Gamepad2, Home, Menu, Music2, Play,
  Plus, Search, Sparkles, X, Clapperboard, GraduationCap
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

const categories = ["All", "Music", "Gaming", "Technology", "Education", "Lifestyle"];

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [menuOpen, setMenuOpen] = useState(false);
  const [videos, setVideos] = useState<Video[]>(demoVideos);
  const [loadingVideos, setLoadingVideos] = useState(true);

  useEffect(() => {
    fetch("/api/videos", { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load videos");
        return response.json();
      })
      .then((result) => {
        const liveVideos: Video[] = (result.videos || []).map((v: any) => ({
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
        if (liveVideos.length) setVideos(liveVideos);
      })
      .catch(() => {})
      .finally(() => setLoadingVideos(false));
  }, []);

  const filtered = useMemo(() => videos.filter((video) => {
    const matchesCategory = category === "All" || video.category === category;
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
            <span className="brand-mark"><Image src="/vibetube-logo.jpg" alt="VibeTube peach logo" width={42} height={42} priority /></span>
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
            <button className="side-link" onClick={() => setCategory("All")}><Compass size={19} /> Explore</button>
            <button className="side-link" onClick={() => setCategory("Music")}><Clapperboard size={19} /> Vibe Shorts</button>
          </nav>
          <div className="side-divider" />
          <p className="side-label">EXPLORE VIBES</p>
          <button className="side-link" onClick={() => setCategory("Music")}><Music2 size={19} /> Music</button>
          <button className="side-link" onClick={() => setCategory("Gaming")}><Gamepad2 size={19} /> Gaming</button>
          <button className="side-link" onClick={() => setCategory("Education")}><GraduationCap size={19} /> Learning</button>
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
              <button className="hero-btn" onClick={() => { setCategory("All"); setQuery(""); }}>
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

          <div className="category-strip">
            {categories.map((item) => (
              <button key={item} onClick={() => setCategory(item)} className={`category-pill ${category === item ? "selected" : ""}`}>{item}</button>
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
                  <Link href={`/watch/${video.id}`} className={`thumbnail thumb-${video.theme}`}>
                    <span className="thumb-emoji">{video.emoji}</span>
                    <span className="play-hover"><Play size={21} fill="white" /></span>
                    <span className="duration">{video.duration}</span>
                  </Link>
                  <div className="video-meta">
                    <div className="creator-avatar">{video.creator.slice(0, 1)}</div>
                    <div className="video-copy">
                      <Link href={`/watch/${video.id}`} className="video-title">{video.title}</Link>
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

          <section className="shorts-section">
            <div className="section-head"><div><span className="section-kicker"><Clapperboard size={15} /> QUICK MOMENTS</span><h2>Vibe Shorts</h2></div><span className="result-count">Coming soon</span></div>
            <div className="shorts-row">
              <div className="short-tile short-one"><span>🌇</span><b>Golden hour</b></div>
              <div className="short-tile short-two"><span>🎸</span><b>Music moments</b></div>
              <div className="short-tile short-three"><span>🚀</span><b>Big ideas</b></div>
              <div className="short-tile short-four"><span>🏄</span><b>Adventure</b></div>
            </div>
          </section>
          <footer className="footer">Made for creators. Built for discovery. <span>✦</span> VibeTube</footer>
        </section>
      </div>

      <nav className="mobile-nav">
        <Link href="/"><Home size={20} /><span>Home</span></Link>
        <button onClick={() => setCategory("All")}><Compass size={20} /><span>Explore</span></button>
        <Link href="/studio"><Plus size={22} /><span>Create</span></Link>
        <button onClick={() => setCategory("Music")}><Clapperboard size={20} /><span>Shorts</span></button>
        <Link href="/studio"><span className="mobile-avatar">R</span><span>You</span></Link>
      </nav>
    </main>
  );
}
