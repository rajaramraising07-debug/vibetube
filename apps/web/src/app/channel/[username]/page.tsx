"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Channel = {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  _count: { videos: number; subscribers: number };
  videos: { id: string; title: string; thumbnailUrl: string | null; views: number }[];
};

type SubscriptionResult = { subscribed: boolean; subscribers: number };

export default function ChannelPage() {
  const { username } = useParams<{ username: string }>();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [error, setError] = useState("");
  const [followMessage, setFollowMessage] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadChannel() {
      try {
        const result = await api<{ channel: Channel }>(`/channels/${username}`);
        if (cancelled) return;
        setChannel(result.channel);
        try {
          const subscription = await api<{ subscribed: boolean }>(`/subscriptions/${result.channel.id}`);
          if (!cancelled) setSubscribed(subscription.subscribed);
        } catch {
          // Public channel browsing also works when the visitor is signed out.
          if (!cancelled) setSubscribed(false);
        }
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "Channel not found.");
      }
    }
    loadChannel();
    return () => { cancelled = true; };
  }, [username]);

  async function toggleSubscription() {
    if (!channel) return;
    try {
      const result = await api<SubscriptionResult>(`/subscriptions/${channel.id}`, {
        method: subscribed ? "DELETE" : "POST"
      });
      setSubscribed(result.subscribed);
      setChannel(current => current ? {
        ...current,
        _count: { ...current._count, subscribers: result.subscribers }
      } : current);
      setFollowMessage(result.subscribed ? "Subscribed!" : "Unsubscribed.");
    } catch (caught) {
      setFollowMessage(caught instanceof Error ? caught.message : "Could not update subscription.");
    }
  }

  if (error) return <main className="studio-page"><p className="watch-error">{error}</p></main>;
  if (!channel) return <main className="studio-page"><p className="watch-error">Loading channel...</p></main>;

  const channelName = channel.displayName || channel.username;
  return (
    <main className="studio-page">
      <header className="watch-header">
        <Link href="/" className="back-link">← VibeTube</Link>
        <span className="watch-brand">vibe<span>tube</span></span>
      </header>
      <section className="studio-content">
        <div className="channel-banner">
          <div className="channel-avatar">{channelName[0].toUpperCase()}</div>
          <div>
            <h1>{channelName}</h1>
            <p>@{channel.username} · {channel._count.subscribers} subscribers · {channel._count.videos} videos</p>
            <p>{channel.bio}</p>
            <button className="subscribe-demo" onClick={toggleSubscription}>
              {subscribed ? "Subscribed" : "Subscribe"}
            </button>
            {followMessage && <small>{followMessage}</small>}
          </div>
        </div>
        <h2>Videos</h2>
        <div className="video-grid">
          {channel.videos.map(video => (
            <Link className="channel-video" href={`/watch/${video.id}`} key={video.id}>
              <div className="channel-thumb">🍑</div>
              <b>{video.title}</b>
              <small>{video.views} views</small>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
