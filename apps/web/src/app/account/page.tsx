"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function AccountPage() {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      await api(mode === "register" ? "/auth/register" : "/auth/login", {
        method: "POST",
        body: JSON.stringify(mode === "register" ? { email, password, username, displayName } : { email, password })
      });
      router.push("/studio"); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not sign in."); }
    finally { setBusy(false); }
  }

  return <main className="account-page">
    <Link href="/" className="account-brand"><Image src="/vibetube-logo.jpg" alt="" width={46} height={46}/><b>vibe<span>tube</span></b></Link>
    <form className="account-card" onSubmit={submit}>
      <span className="section-kicker">WELCOME TO YOUR NEXT VIBE</span>
      <h1>{mode === "register" ? "Create your account" : "Welcome back"}</h1>
      <p>Join VibeTube to share videos and follow creators.</p>
      {mode === "register" && <>
        <label>Username<input required minLength={3} maxLength={24} value={username} onChange={e=>setUsername(e.target.value)} placeholder="your_username"/></label>
        <label>Display name<input maxLength={60} value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Your name"/></label>
      </>}
      <label>Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
      <label>Password<input required type="password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/></label>
      {error && <div className="form-error">{error}</div>}
      <button className="account-submit" disabled={busy}>{busy ? "Please wait..." : mode === "register" ? "Create account" : "Sign in"}</button>
      <p className="account-switch">{mode === "register" ? "Already have an account?" : "New to VibeTube?"} <button type="button" onClick={()=>{setMode(mode==="register"?"login":"register");setError("");}}>{mode==="register"?"Sign in":"Create account"}</button></p>
    </form>
  </main>;
}
