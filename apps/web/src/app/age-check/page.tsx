"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

export default function AgeCheckPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api<{ verified: boolean; denied?: boolean }>("/age/status")
      .then(result => {
        if (active && result.verified) router.replace("/");
        else if (active && result.denied) { setDenied(true); setChecking(false); }
        else if (active) setChecking(false);
      })
      .catch(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [router]);

  async function confirmAdult() {
    setBusy(true);
    setError("");
    try {
      await api<{ verified: boolean }>("/age/confirm", {
        method: "POST",
        body: JSON.stringify({ over18: true })
      });
      router.replace("/");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not confirm your age.");
    } finally {
      setBusy(false);
    }
  }

  async function declineAdultAccess() {
    setBusy(true);
    setError("");
    try {
      await api<{ denied: boolean }>("/age/decline", { method: "POST" });
      setDenied(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not record your choice.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="age-gate-page">
      <section className="age-gate-card" aria-labelledby="age-gate-title">
        <Link href="/age-check" className="age-gate-brand" aria-label="VibeTube age check">
          vibe<span>tube</span>
        </Link>
        <span className="age-gate-badge">18+</span>
        <h1 id="age-gate-title">Adults only</h1>
        <p className="age-gate-copy">You must be 18 or older to enter VibeTube.</p>

        {checking ? <p role="status">Checking age confirmation…</p> : denied ? (
          <div className="age-gate-denied" role="alert">
            <strong>Access denied</strong>
            <p>You said you are not 18 or older, so you cannot continue to VibeTube.</p>
          </div>
        ) : (
          <div className="age-gate-actions">
            <button className="age-gate-confirm" onClick={confirmAdult} disabled={busy}>
              {busy ? "Please wait…" : "I am 18 or older"}
            </button>
            <button className="age-gate-deny" onClick={declineAdultAccess} disabled={busy}>
              I am not 18 or older
            </button>
          </div>
        )}

        {error && <p className="age-gate-error" role="alert">{error}</p>}
        <p className="age-gate-note">
          Your confirmation is stored in a secure, signed browser cookie for 30 days. This is a self-declaration and does not verify identity or date of birth.
        </p>
      </section>
    </main>
  );
}
