import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VibeTube — Discover your next vibe",
  description: "Watch what you love. Share what inspires you."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
