"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Bell, Captions, Check, Download, Maximize, Minimize, MonitorPlay, Pause, Play, Settings, Share2, ThumbsDown, ThumbsUp, Volume2, VolumeX } from "lucide-react";
import { api } from "@/lib/api";

type Video = { id:string; title:string; description:string; streamUid:string; duration?:number|null; views:number; creator:{id:string;username:string;displayName:string|null;avatarUrl?:string|null}; _count:{likes:number;comments:number} };
type Comment = { id:string; body:string; createdAt:string; user:{username:string;displayName:string|null} };
type Recommendation = { id:string; title:string; creator:string; thumbnailUrl?:string; duration:string; views:string; external:boolean };

function formatDuration(value: number) {
  const seconds = Math.max(0, Math.floor(value || 0));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function WatchPage() {
  const params = useParams<{id:string}>();
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const externalIdCandidate = params.id.startsWith("eporner_") ? params.id.slice("eporner_".length) : "";
  const externalId = /^[A-Za-z0-9_-]{4,40}$/.test(externalIdCandidate) ? externalIdCandidate : "";
  const externalTitle = searchParams.get("title")?.slice(0, 180) || "Eporner video";
  const [video,setVideo] = useState<Video|null>(null);
  const [comments,setComments] = useState<Comment[]>([]);
  const [body,setBody] = useState("");
  const [liked,setLiked] = useState(false);
  const [likes,setLikes] = useState(0);
  const [disliked,setDisliked] = useState(false);
  const [subscribed,setSubscribed] = useState(false);
  const [recommendations,setRecommendations] = useState<Recommendation[]>([]);
  const [loadingRecommendations,setLoadingRecommendations] = useState(true);
  const [error,setError] = useState("");
  const [playing,setPlaying] = useState(false);
  const [currentTime,setCurrentTime] = useState(0);
  const [duration,setDuration] = useState(0);
  const [volume,setVolume] = useState(1);
  const [muted,setMuted] = useState(false);
  const [captionsOn,setCaptionsOn] = useState(false);
  const [theater,setTheater] = useState(false);
  const [settingsOpen,setSettingsOpen] = useState(false);
  const [playbackRate,setPlaybackRate] = useState(1);
  const [saved,setSaved] = useState(false);

  async function loadComments() {
    try { const result=await api<{comments:Comment[]}>(`/videos/${params.id}/comments`); setComments(result.comments); } catch {}
  }
  useEffect(()=>{
    if (externalId) return;
    api<{video:Video}>(`/videos/${params.id}`).then(r=>{setVideo(r.video);setLikes(r.video._count.likes);}).catch(e=>setError(e.message));
    loadComments();
    api(`/videos/${params.id}/view`,{method:"POST"}).catch(()=>{});
  },[params.id, externalId]);

  useEffect(()=>{
    if(!video)return;
    api<{liked:boolean;likes:number}>(`/videos/${video.id}/like`).then(result=>{setLiked(result.liked);setLikes(result.likes);}).catch(()=>{});
    api<{subscribed:boolean}>(`/subscriptions/${video.creator.id}`).then(result=>setSubscribed(result.subscribed)).catch(()=>{});
    api<{saved:boolean}>(`/playlists/watch-later/${video.id}`).then(result=>setSaved(result.saved)).catch(()=>{});
  },[video?.id,video?.creator.id]);

  useEffect(()=>{
    const controller = new AbortController();
    setLoadingRecommendations(true);
    Promise.allSettled([
      api<{videos:Array<{id:string;title:string;thumbnailUrl?:string;duration?:number;views?:number;creator:{username:string;displayName:string|null}}> }>("/videos", {signal:controller.signal}),
      api<{videos:Array<{id:string;title:string;thumbnailUrl?:string;duration?:number;views?:number;creator?:string}> }>("/external-videos?category=Eporner", {signal:controller.signal})
    ]).then(([savedResult,externalResult])=>{
      if (controller.signal.aborted) return;
      const savedVideos = savedResult.status === "fulfilled" ? savedResult.value.videos : [];
      const external = externalResult.status === "fulfilled" ? externalResult.value.videos : [];
      const next:Recommendation[] = [
        ...external.map(v=>({id:v.id,title:v.title,creator:v.creator||"Eporner",thumbnailUrl:v.thumbnailUrl,duration:formatDuration(v.duration||0),views:`${Number(v.views||0).toLocaleString()} views`,external:true})),
        ...savedVideos.map(v=>({id:v.id,title:v.title,creator:v.creator?.displayName||v.creator?.username||"VibeTube Creator",thumbnailUrl:v.thumbnailUrl,duration:formatDuration(v.duration||0),views:`${Number(v.views||0).toLocaleString()} views`,external:false}))
      ];
      setRecommendations(next.filter((item,index)=>item.id!==params.id&&next.findIndex(candidate=>candidate.id===item.id)===index).slice(0,10));
    }).finally(()=>{if(!controller.signal.aborted)setLoadingRecommendations(false);});
    return ()=>controller.abort();
  },[params.id]);

  const watchNextHref = (item:Recommendation) => item.external ? `/watch/${encodeURIComponent(item.id)}?title=${encodeURIComponent(item.title)}` : `/watch/${encodeURIComponent(item.id)}`;
  const nextVideo = () => { if (recommendations[0]) window.location.assign(watchNextHref(recommendations[0])); };
  const togglePlay = () => { const player=videoRef.current; if (!player) return; if (player.paused) void player.play(); else player.pause(); };
  const changeVolume = (value:number) => { const player=videoRef.current; setVolume(value); setMuted(value===0); if(player){player.volume=value;player.muted=value===0;} };
  const toggleMute = () => { const player=videoRef.current; if(!player)return; player.muted=!player.muted; setMuted(player.muted); if(!player.muted&&player.volume===0){player.volume=.5;setVolume(.5);} };
  const seek = (value:number) => { if(videoRef.current) videoRef.current.currentTime=value; setCurrentTime(value); };
  const toggleCaptions = () => {
    const tracks=videoRef.current?.textTracks;
    if (!tracks?.length) { setError("No caption track is available for this video."); return; }
    const next=!captionsOn;
    for(let i=0;i<tracks.length;i++) tracks[i].mode=next?"showing":"hidden";
    setCaptionsOn(next);
  };
  const toggleTheater = () => setTheater(value=>!value);
  const toggleFullscreen = () => { if(!document.fullscreenElement) void frameRef.current?.requestFullscreen(); else void document.exitFullscreen(); };
  const miniPlayer = async () => { try { if(document.pictureInPictureElement) await document.exitPictureInPicture(); else await videoRef.current?.requestPictureInPicture(); } catch { setError("Miniplayer is not supported by this browser."); } };
  const selectRate = (rate:number) => { setPlaybackRate(rate); if(videoRef.current) videoRef.current.playbackRate=rate; setSettingsOpen(false); };
  async function like() {
    try { const r=await api<{liked:boolean;likes:number}>(`/videos/${params.id}/like`,{method:"POST"});setLiked(r.liked);setLikes(r.likes);setDisliked(false); }
    catch { setError("Sign in to like this video."); }
  }
  async function subscribe() {
    if (!video) return;
    try { const r=await api<{subscribed:boolean}>(`/subscriptions/${video.creator.id}`,{method:subscribed?"DELETE":"POST"});setSubscribed(r.subscribed); }
    catch { setError("Sign in to subscribe to this channel."); }
  }
  async function saveVideo() {
    try { await api(`/playlists/watch-later/${params.id}`,{method:"POST"});setSaved(true); }
    catch { setError("Sign in to save this video to Watch later."); }
  }
  async function shareVideo() {
    try { if(navigator.share) await navigator.share({title:video?.title||externalTitle,url:window.location.href}); else {await navigator.clipboard.writeText(window.location.href);setError("Link copied to clipboard.");} }
    catch (e) { if(e instanceof Error&&e.name!=="AbortError") setError("Could not share this link."); }
  }
  async function comment(event:React.FormEvent) {
    event.preventDefault();
    try { await api(`/videos/${params.id}/comments`,{method:"POST",body:JSON.stringify({body})});setBody("");loadComments(); }
    catch { setError("Sign in to comment."); }
  }

  function watchNextFeed() {
    return <aside className="watch-aside watch-next">
      <div className="watch-next-heading"><span className="section-kicker">RECOMMENDED</span><h2>Up next</h2></div>
      {loadingRecommendations ? <p className="watch-next-status">Loading videos…</p> : recommendations.length ? <div className="watch-next-list">
        {recommendations.map(item=><Link href={watchNextHref(item)} className="watch-next-item" key={item.id}>
          <span className="watch-next-thumb" style={item.thumbnailUrl?{backgroundImage:`linear-gradient(#0001,#0004),url("${item.thumbnailUrl}")`}:undefined}><Play size={17} fill="currentColor"/></span>
          <span className="watch-next-copy"><strong>{item.title}</strong><small>{item.creator}</small><small>{item.views} · {item.duration}</small></span>
        </Link>)}
      </div> : <p className="watch-next-status">No more videos to show yet.</p>}
      <Link href="/" className="back-home-btn">Explore all videos</Link>
    </aside>;
  }

  if (externalId) return <main className="watch-page">
    <header className="watch-header"><Link href="/" className="back-link"><ArrowLeft size={19}/> Back to VibeTube</Link><span className="watch-brand">vibe<span>tube</span></span></header>
    <div className="watch-layout"><section>
      <div className="player-frame"><iframe src={`https://www.eporner.com/embed/${externalId}/`} title={externalTitle} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div>
      <h1 className="watch-title">{externalTitle}</h1>
      <div className="watch-meta"><span className="watch-action">Eporner embedded video</span><button className="watch-action" onClick={shareVideo}><Share2 size={17}/> Share</button><button className="watch-action" onClick={nextVideo} disabled={!recommendations.length}><Play size={17}/> Next video</button></div>
      <div className="description-box"><strong>Eporner video</strong><p>Playing here on VibeTube through Eporner’s embedded player. Playback, volume, captions, and fullscreen controls are provided by the embedded player.</p></div>
      {error&&<p className="watch-feedback">{error}</p>}
    </section>{watchNextFeed()}</div>
  </main>;

  if(error && !video) return <main className="watch-page"><header className="watch-header"><Link href="/" className="back-link"><ArrowLeft size={19}/> Back</Link></header><p className="watch-error">{error}</p></main>;
  if(!video) return <main className="watch-page"><p className="watch-error">Loading video...</p></main>;

  return <main className={`watch-page${theater?" watch-theater":""}`}>
    <header className="watch-header"><Link href="/" className="back-link"><ArrowLeft size={19}/> Back to VibeTube</Link><span className="watch-brand">vibe<span>tube</span></span></header>
    <div className="watch-layout"><section>
      <div className="player-frame custom-player" ref={frameRef}>
        <video ref={videoRef} playsInline preload="metadata" src={video.streamUid} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onTimeUpdate={e=>setCurrentTime(e.currentTarget.currentTime)} onLoadedMetadata={e=>setDuration(e.currentTarget.duration||video.duration||0)} onDurationChange={e=>setDuration(e.currentTarget.duration||video.duration||0)} onVolumeChange={e=>{setVolume(e.currentTarget.volume);setMuted(e.currentTarget.muted);}}>
          Your browser does not support HTML video.
        </video>
        <div className="player-controls" aria-label="Video controls">
          <input className="player-seek" aria-label="Seek" type="range" min="0" max={duration||100} step="0.1" value={Math.min(currentTime,duration||100)} onChange={e=>seek(Number(e.target.value))}/>
          <div className="player-control-row">
            <div className="player-control-group">
              <button title={playing?"Pause":"Play"} aria-label={playing?"Pause":"Play"} onClick={togglePlay}>{playing?<Pause size={19}/>:<Play size={19}/>}</button>
              <button title="Next video" aria-label="Next video" onClick={nextVideo} disabled={!recommendations.length}><MonitorPlay size={19}/></button>
              <button title={muted?"Unmute":"Mute"} aria-label={muted?"Unmute":"Mute"} onClick={toggleMute}>{muted?<VolumeX size={19}/>:<Volume2 size={19}/>}</button>
              <input className="player-volume" aria-label="Volume" type="range" min="0" max="1" step="0.05" value={muted?0:volume} onChange={e=>changeVolume(Number(e.target.value))}/>
              <span className="player-time">{formatDuration(currentTime)} / {formatDuration(duration)}</span>
            </div>
            <div className="player-control-group">
              <button title={captionsOn?"Turn captions off":"Closed captions"} aria-label="Closed captions" onClick={toggleCaptions}><Captions size={19}/><span className="control-label">CC</span></button>
              <div className="player-settings-wrap"><button title="Settings" aria-label="Settings" onClick={()=>setSettingsOpen(v=>!v)}><Settings size={19}/></button>{settingsOpen&&<div className="player-settings"><strong>Playback speed</strong>{[0.5,0.75,1,1.25,1.5,2].map(rate=><button key={rate} onClick={()=>selectRate(rate)}>{rate}× {playbackRate===rate&&<Check size={14}/>}</button>)}</div>}</div>
              <button title="Miniplayer" aria-label="Miniplayer" onClick={miniPlayer}><Minimize size={18}/></button>
              <button title={theater?"Exit theater mode":"Theater mode"} aria-label="Theater mode" onClick={toggleTheater}><MonitorPlay size={19}/></button>
              <button title="Full screen" aria-label="Full screen" onClick={toggleFullscreen}><Maximize size={19}/></button>
            </div>
          </div>
        </div>
      </div>
      <h1 className="watch-title">{video.title}</h1>
      <div className="watch-meta">
        <div className="creator-avatar">{video.creator.avatarUrl?<img src={video.creator.avatarUrl} alt=""/>:(video.creator.displayName||video.creator.username).slice(0,1).toUpperCase()}</div>
        <div className="watch-creator"><strong>{video.creator.displayName||video.creator.username}</strong><small>@{video.creator.username}</small></div>
        <Link href={`/channel/${video.creator.username}`} className="subscribe-demo">Channel</Link>
        <button className="subscribe-demo" onClick={subscribe}><Bell size={16}/>{subscribed?"Subscribed":"Subscribe"}</button>
        <button className={`watch-action${liked?" is-active":""}`} onClick={like}><ThumbsUp size={17}/> {likes} {liked?"Liked":"Like"}</button>
        <button className={`watch-action${disliked?" is-active":""}`} onClick={()=>{setDisliked(v=>!v);setLiked(false);}}><ThumbsDown size={17}/> Dislike</button>
        <button className="watch-action" onClick={shareVideo}><Share2 size={17}/> Share</button>
        <a className="watch-action" href={video.streamUid} download><Download size={17}/> Download</a>
        <button className={`watch-action${saved?" is-active":""}`} onClick={saveVideo}>{saved?<Check size={17}/>:<MonitorPlay size={17}/>} {saved?"Saved":"Save"}</button>
      </div>
      <div className="description-box"><strong>{video.views.toLocaleString()} views{video.duration?` · ${formatDuration(video.duration)}`:""}</strong><p>{video.description}</p></div>
      {error&&<p className="watch-feedback">{error}</p>}
      <div className="comments-placeholder"><h2>Comments ({comments.length})</h2><form onSubmit={comment} className="comment-form"><input value={body} onChange={e=>setBody(e.target.value)} placeholder="Add a comment..." maxLength={2000}/><button>Post</button></form>{comments.map(c=><div className="comment-item" key={c.id}><b>{c.user.displayName||c.user.username}</b><p>{c.body}</p></div>)}</div>
    </section>{watchNextFeed()}</div>
  </main>;
}
