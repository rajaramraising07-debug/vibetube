"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowLeft, UploadCloud, Video, LogOut } from "lucide-react";
import { api } from "@/lib/api";

type Me = { id: string; username: string; displayName: string | null };
type StudioVideo = { id: string; title: string; status: string; views: number; createdAt: string };

export default function StudioPage() {
  const [user, setUser] = useState<Me | null>(null);
  const [videos, setVideos] = useState<StudioVideo[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Technology");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const me = await api<{user:Me}>("/auth/me"); setUser(me.user);
      const result = await api<{videos:StudioVideo[]}>("/studio/videos"); setVideos(result.videos);
    } catch { setUser(null); }
  }
  useEffect(() => { load(); }, []);

  async function upload(event: React.FormEvent) {
    event.preventDefault(); setMessage("");
    if (!file) { setMessage("Choose a video file first."); return; }
    if (file.size > 500 * 1024 * 1024) { setMessage("Maximum video size is 500 MB."); return; }
    setBusy(true);
    try {
      const signed = await api<{uploadUrl:string;key:string;publicUrl:string}>("/uploads/video-url", {
        method:"POST", body:JSON.stringify({filename:file.name,contentType:file.type,size:file.size})
      });
      const putResponse = await fetch(signed.uploadUrl,{method:"PUT",headers:{"Content-Type":file.type},body:file});
      if (!putResponse.ok) throw new Error("Video upload failed. Check the R2 bucket CORS settings or local API logs.");
      const videoUrl = new URL(signed.publicUrl, window.location.origin).toString();
      await api("/videos",{method:"POST",body:JSON.stringify({title,description,category,tags:[],videoUrl})});
      setMessage("Video published successfully."); setTitle(""); setDescription(""); setFile(null);
      await load();
    } catch(e) { setMessage(e instanceof Error ? e.message : "Upload failed."); }
    finally { setBusy(false); }
  }

  async function logout() {
    await api("/auth/logout",{method:"POST"}); setUser(null); window.location.href="/";
  }

  if (!user) return <main className="account-page"><div className="account-card"><h1>Creator Studio</h1><p>Sign in to upload and manage your videos.</p><Link className="account-submit" href="/account">Sign in / Create account</Link></div></main>;

  return <main className="studio-page">
    <header className="watch-header"><Link href="/" className="back-link"><ArrowLeft size={19}/> Back to VibeTube</Link><span className="watch-brand">creator <span>studio</span></span><button className="watch-action" onClick={logout}><LogOut size={16}/> Sign out</button></header>
    <section className="studio-content">
      <span className="section-kicker">VIBETUBE FOR CREATORS</span><h1>Welcome, {user.displayName || user.username}.</h1><p className="studio-intro">Upload a video and share it with the VibeTube community.</p>
      <div className="studio-grid">
        <form className="studio-card upload-form" onSubmit={upload}>
          <UploadCloud size={26}/><h2>Upload a video</h2>
          <label>Video title<input required minLength={3} maxLength={120} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Give your video a title"/></label>
          <label>Description<textarea maxLength={5000} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Tell viewers about your video"/></label>
          <label>Category<select value={category} onChange={e=>setCategory(e.target.value)}>{["Music","Gaming","Technology","Education","Lifestyle","Entertainment","Sports","Other"].map(c=><option key={c}>{c}</option>)}</select></label>
          <label className="file-picker">Choose video (MP4, WebM, MOV; max 500 MB)<input required type="file" accept="video/mp4,video/webm,video/quicktime" onChange={e=>setFile(e.target.files?.[0]||null)}/></label>
          {file && <small className="file-name">{file.name} · {(file.size/1024/1024).toFixed(1)} MB</small>}
          {message && <p className="upload-message">{message}</p>}
          <button className="account-submit" disabled={busy}>{busy?"Uploading...":"Publish video"}</button>
        </form>
        <div className="studio-card"><Video size={26}/><h2>Your content</h2><p>Your published videos and view counts.</p><div className="studio-video-list">{videos.length ? videos.map(v=><div key={v.id}><b>{v.title}</b><small>{v.views} views · {v.status}</small></div>) : <small>No videos published yet.</small>}</div></div>
        <div className="studio-card"><h2>Creator checklist</h2><p>Use a clear title, choose the right category and upload content you have permission to share.</p><p>With R2 configured, videos are stored in your Cloudflare bucket. In local development without R2, videos are saved to a local ignored folder for preview and playback.</p></div>
      </div>
    </section>
  </main>;
}
