"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bell, Compass, Flame, Home, Menu, Play, Plus, Search, Sparkles, X
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

const epornerCategoryGroups = [
  { label: "Popular", items: ["Japanese", "Anal", "POV", "Indian", "MILF", "BBW", "Pinay"] },
  { label: "Categories A–Z", items: ["Amateur", "Asian", "ASMR", "BDSM", "Big Ass", "Big Dick", "Big Tits", "Cosplay", "Creampie", "Cuckold", "Ebony", "Footjob", "Group Sex", "Hardcore", "Homemade", "Indonesia", "Interracial", "Latina", "Massage", "Mature", "Orgy", "Redhead", "Solo girls", "Threesome", "Vintage"] },
  { label: "Orientation", items: ["Gay", "Lesbian", "Transgender"] },
  { label: "Formats", items: ["4K Ultra HD", "HD 1080p", "60 FPS", "VR Porn"] }
];
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
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [videos, setVideos] = useState<Video[]>(demoVideos);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const searchSuggestions = useMemo(() => {
    const term = query.trim().toLowerCase();
    const categories = epornerCategoryGroups.flatMap((group) => group.items).filter((item) => !term || item.toLowerCase().includes(term));
    const titles = videos.filter((video) => video.externalUrl && term && video.title.toLowerCase().includes(term)).map((video) => video.title);
    return [...new Set([...titles, ...categories])].slice(0, 7);
  }, [query, videos]);

  function chooseSuggestion(value: string) {
    setQuery(value);
    setSearchTerm(value.trim());
    setPage(1);
    setSuggestionsOpen(false);
  }

  function exploreVideos(nextCategory = "All") {
    setCategory(nextCategory);
    setQuery("");
    setSearchTerm("");
    setPage(1);
    setMenuOpen(false);
    window.requestAnimationFrame(() => {
      document.getElementById("videos")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function selectCategory(nextCategory: string) {
    setCategory(nextCategory);
    setQuery("");
    setSearchTerm("");
    setPage(1);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchTerm(query.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    setLoadingVideos(true);
    const externalParams = new URLSearchParams({ category, page: String(page) });
    if (searchTerm) externalParams.set("q", searchTerm);
    const externalUrl = `/api/external-videos?${externalParams}`;
    if (page === 1) setHasMore(false);
    Promise.allSettled([
      fetch("/api/videos", { credentials: "include", signal: controller.signal }).then((response) => response.ok ? response.json() : { videos: [] }),
      fetch(externalUrl, { credentials: "include", signal: controller.signal }).then((response) => response.ok ? response.json() : { videos: [] })
    ]).then(([savedResult, externalResult]) => {
        if (controller.signal.aborted) return;
        const saved = savedResult.status === "fulfilled" ? savedResult.value.videos || [] : [];
        const externalData = externalResult.status === "fulfilled" ? externalResult.value : { videos: [], hasMore: false };
        const external = externalData.videos || [];
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
          category: v.category || "Eporner",
          duration: `${Math.floor(Number(v.duration || 0) / 60)}:${String(Number(v.duration || 0) % 60).padStart(2, "0")}`,
          emoji: "▶",
          theme: "pink",
          thumbnailUrl: v.thumbnailUrl,
          externalUrl: v.externalUrl
        }));
        setVideos((current) => page === 1 ? [...liveVideos, ...externalVideos] : [...current, ...externalVideos]);
        setHasMore(externalData.hasMore === true);
      })
      .catch(() => {})
      .finally(() => { if (!controller.signal.aborted) setLoadingVideos(false); });
    return () => controller.abort();
  }, [category, page, searchTerm]);

  const filtered = useMemo(() => videos.filter((video) => {
    const matchesCategory = video.externalUrl
      ? category === "All" || category === "Eporner" || video.category === category
      : category === "All" || video.category === category;
    const haystack = `${video.title} ${video.creator} ${video.category}`.toLowerCase();
    const matchesQuery = video.externalUrl
      ? !query.trim() || query.trim() === searchTerm
      : haystack.includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  }), [category, query, searchTerm, videos]);

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

        <div className="searchbox">
          <label className="searchbar">
            <Search size={18} />
            <input value={query} onFocus={() => setSuggestionsOpen(true)} onChange={(event) => { setQuery(event.target.value); setPage(1); setSuggestionsOpen(true); }} onKeyDown={(event) => { if(event.key === "Enter") { setSearchTerm(query.trim()); setSuggestionsOpen(false); } if(event.key === "Escape") setSuggestionsOpen(false); }} placeholder="Search Eporner videos..." aria-label="Search Eporner videos" aria-expanded={suggestionsOpen} aria-controls="search-suggestions" />
            {query && <button type="button" onClick={() => {setQuery("");setSearchTerm("");}} aria-label="Clear search"><X size={16} /></button>}
          </label>
          {suggestionsOpen && (query.trim() || searchSuggestions.length > 0) && <div className="search-suggestions" id="search-suggestions" role="listbox" aria-label="Search suggestions">
            {query.trim() && <button type="button" role="option" onMouseDown={(event) => event.preventDefault()} onClick={() => chooseSuggestion(query.trim())}><Search size={15}/> Search Eporner for “{query.trim()}”</button>}
            {searchSuggestions.map((suggestion) => <button type="button" role="option" key={suggestion} onMouseDown={(event) => event.preventDefault()} onClick={() => chooseSuggestion(suggestion)}><Search size={14}/> {suggestion}</button>)}
          </div>}
        </div>

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
          {epornerCategoryGroups.map((group) => (
            <div className="side-category-group" key={group.label}>
              <p className="side-label">{group.label}</p>
              {group.items.map((item) => (
                <button key={item} className={`side-link ${category === item ? "active" : ""}`} onClick={() => exploreVideos(item)}>{item}</button>
              ))}
            </div>
          ))}
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

          <div className="category-browser" id="videos">
            <div className="category-strip">
              <button onClick={() => selectCategory("All")} className={`category-pill ${category === "All" ? "selected" : ""}`}>All</button>
              <button onClick={() => selectCategory("Eporner")} className={`category-pill ${category === "Eporner" ? "selected" : ""}`}>Eporner</button>
            </div>
            {epornerCategoryGroups.map((group) => (
              <section className="category-group" key={group.label}>
                <h3>{group.label}</h3>
                <div className="category-strip">
                  {group.items.map((item) => (
                    <button key={item} onClick={() => selectCategory(item)} className={`category-pill ${category === item ? "selected" : ""}`}>{item}</button>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="section-head">
            <div><span className="section-kicker"><Flame size={15} /> {category === "All" || category === "Eporner" ? "EPORNER VIDEOS" : "EPORNER CATEGORY"}</span><h2>{query ? "Search results" : category === "All" ? "Trending right now" : category === "Eporner" ? "All videos" : category}</h2></div>
            <span className="result-count">{loadingVideos ? "Loading…" : `${filtered.length} videos`}</span>
          </div>

          {filtered.length ? (
            <div className="video-grid">
              {filtered.map((video) => (
                <article className="video-card" key={video.id}>
                  <Link href={video.externalUrl ? `/watch/${encodeURIComponent(video.id)}?title=${encodeURIComponent(video.title)}` : `/watch/${video.id}`} className={`thumbnail thumb-${video.theme}`} style={video.thumbnailUrl ? { backgroundImage: `linear-gradient(#0001,#0004), url("${video.thumbnailUrl}")` } : undefined}>
                    <span className="thumb-emoji">{video.emoji}</span>
                    <span className="play-hover"><Play size={21} fill="white" /></span>
                    <span className="duration">{video.duration}</span>
                  </Link>
                  <div className="video-meta">
                    <div className="creator-avatar">{video.creator.slice(0, 1)}</div>
                    <div className="video-copy">
                      <Link href={video.externalUrl ? `/watch/${encodeURIComponent(video.id)}?title=${encodeURIComponent(video.title)}` : `/watch/${video.id}`} className="video-title">{video.title}</Link>
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

          {hasMore && <div className="load-more-wrap"><button className="load-more-btn" disabled={loadingVideos} onClick={() => setPage((current) => current + 1)}>{loadingVideos ? "Loading…" : "Load more videos"}</button></div>}

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
