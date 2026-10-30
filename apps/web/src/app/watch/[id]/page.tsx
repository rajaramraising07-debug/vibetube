"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ThumbsUp, Share2, Bell } from "lucide-react";
import { api } from "@/lib/api";

type Video = { id:string; title:string; description:string; streamUid:string; views:number; creator:{id:string;username:string;displayName:string|null}; _count:{likes:number;comments:number} };
type Comment = { id:string; body:string; createdAt:string; user:{username:string;displayName:string|null} };

export default function WatchPage() {
  const params = useParams<{id:string}>();
  const searchParams = useSearchParams();
  const externalIdCandidate = params.id.startsWith("eporner_") ? params.id.slice("eporner_".length) : "";
  const externalId = /^[A-Za-z0-9_-]{4,40}$/.test(externalIdCandidate) ? externalIdCandidate : "";
  const externalTitle = searchParams.get("title")?.slice(0, 180) || "Eporner video";
  const [video,setVideo] = useState<Video|null>(null);
  const [comments,setComments] = useState<Comment[]>([]);
  const [body,setBody] = useState("");
  const [liked,setLiked] = useState(false);
  const [likes,setLikes] = useState(0);
  const [error,setError] = useState("");

  async function loadComments() {
    try { const result=await api<{comments:Comment[]}>(`/videos/${params.id}/comments`); setComments(result.comments); } catch {}
  }
  useEffect(()=>{
    if (externalId) return;
    api<{video:Video}>(`/videos/${params.id}`).then(r=>{setVideo(r.video);setLikes(r.video._count.likes);}).catch(e=>setError(e.message));
    loadComments();
    api(`/videos/${params.id}/view`,{method:"POST"}).catch(()=>{});
  },[params.id, externalId]);

  async function like() {
    try { const r=await api<{liked:boolean;likes:number}>(`/videos/${params.id}/like`,{method:"POST"});setLiked(r.liked);setLikes(r.likes); }
    catch { setError("Sign in to like this video."); }
  }
  async function comment(event:React.FormEvent) {
    event.preventDefault();
    try { await api(`/videos/${params.id}/comments`,{method:"POST",body:JSON.stringify({body})});setBody("");loadComments(); }
    catch { setError("Sign in to comment."); }
  }

  if (externalId) return <main className="watch-page">
    <header className="watch-header"><Link href="/" className="back-link"><ArrowLeft size={19}/> Back to VibeTube</Link><span className="watch-brand">vibe<span>tube</span></span></header>
    <div className="watch-layout"><section>
      <div className="player-frame"><iframe src={`https://www.eporner.com/embed/${externalId}/`} title={externalTitle} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div>
      <h1 className="watch-title">{externalTitle}</h1>
      <div className="description-box"><strong>Eporner video</strong><p>Playing here on VibeTube through Eporner’s embedded player.</p></div>
    </section><aside className="watch-aside"><div className="aside-peach">🍑</div><h3>More than just videos.</h3><p>Discover creators and content that match your vibe.</p><Link href="/" className="back-home-btn">Explore VibeTube</Link></aside></div>
  </main>;

  if(error && !video) return <main className="watch-page"><header className="watch-header"><Link href="/" className="back-link"><ArrowLeft size={19}/> Back</Link></header><p className="watch-error">{error}</p></main>;
  if(!video) return <main className="watch-page"><p className="watch-error">Loading video...</p></main>;

  return <main className="watch-page">
    <header className="watch-header"><Link href="/" className="back-link"><ArrowLeft size={19}/> Back to VibeTube</Link><span className="watch-brand">vibe<span>tube</span></span></header>
    <div className="watch-layout"><section>
      <div className="player-frame"><video controls playsInline preload="metadata" src={video.streamUid}>Your browser does not support HTML video.</video></div>
      <h1 className="watch-title">{video.title}</h1>
      <div className="watch-meta"><div className="creator-avatar">{(video.creator.displayName||video.creator.username).slice(0,1).toUpperCase()}</div><div className="watch-creator"><strong>{video.creator.displayName||video.creator.username}</strong><small>@{video.creator.username}</small></div><Link href={`/channel/${video.creator.username}`} className="subscribe-demo"><Bell size={16}/> Channel</Link><button className="watch-action" onClick={like}><ThumbsUp size={17}/> {likes} {liked?"Liked":"Like"}</button><button className="watch-action" onClick={()=>navigator.clipboard.writeText(window.location.href)}><Share2 size={17}/> Share</button></div>
      <div className="description-box"><strong>{video.views.toLocaleString()} views</strong><p>{video.description}</p></div>
      <div className="comments-placeholder"><h2>Comments ({comments.length})</h2><form onSubmit={comment} className="comment-form"><input value={body} onChange={e=>setBody(e.target.value)} placeholder="Add a comment..." maxLength={2000}/><button>Post</button></form>{error&&<p>{error}</p>}{comments.map(c=><div className="comment-item" key={c.id}><b>{c.user.displayName||c.user.username}</b><p>{c.body}</p></div>)}</div>
    </section><aside className="watch-aside"><div className="aside-peach">🍑</div><h3>More than just videos.</h3><p>Discover creators and content that match your vibe.</p><Link href="/" className="back-home-btn">Explore VibeTube</Link></aside></div>
  </main>;
}
