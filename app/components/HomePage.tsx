"use client";

import { useEffect, useState } from "react";
import { BigNewsCard } from "./BigNewsCard";
import HeaderBar from "./HeaderBar";
import Hero from "./Hero";
import ShareKnowledge from "./ShareKnowledge";
import HowItWorks from "./HowItWorks";

type Me = { email: string | null; role: "admin" | "contributor" | null };

interface Config {
  urls: {
    meetingUpload?: string;
    articleUpload?: string;
    documentsUpload?: string;
    aiExchangeUpload?: string;
    adminBase?: string;
    elevenLabs?: string;
    news?: string;
  };
  features: {
    showBigNewsBanner: boolean;
    bigNewsBadge: string;
  };
}

export function HomePage() {
  const [me, setMe] = useState<Me>({ email: null, role: null });
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [meRes, cfgRes] = await Promise.all([
          fetch("/api/me", { cache: "no-store" }),
          fetch("/api/config", { cache: "no-store" }),
        ]);
        const meJson = (await meRes.json()) as Me;
        const cfgJson = (await cfgRes.json()) as Config;
        if (!mounted) return;
        setMe(meJson);
        setConfig(cfgJson);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    window.location.href = "/login";
  }

  if (loading) {
    return (
      <div className="min-h-dvh grid place-items-center px-6">
        <div className="flex items-center gap-2 text-neutral-600">
          <span className="size-3 rounded-full bg-neutral-400 animate-pulse" />
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  if (!me.email) {
    return (
      <div className="min-h-dvh grid place-items-center px-6">
        <div className="text-center max-w-md glass-card p-6">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Not signed in
          </h1>
          <p className="text-neutral-600 mt-2">
            Please go to the sign-in page to continue.
          </p>
          <a
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg border border-black/5 bg-gradient-to-b from-[var(--color-brand-primary)] to-[#077e83] px-4 py-2 text-white font-semibold shadow-md mt-4"
          >
            Go to sign in →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh px-4 md:px-6 py-8 font-sans">
      <div className="mx-auto max-w-6xl glass-shell p-5 md:p-6 lg:p-8">
        {/* Header */}
        <HeaderBar
          meEmail={me.email}
          meRole={(me.role ?? "contributor") as "admin" | "contributor"}
          adminUrl={config?.urls.adminBase}
          onSignOut={handleSignOut}
        />

        {/* Hero */}
        <Hero />

        {/* Main grid */}
        <main className="mt-8 md:mt-10 grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">
          {/* Top banner */}
          <section className="lg:col-span-12 glass-card p-0 overflow-hidden">
            <BigNewsCard
              href={config?.urls.news}
              badge={config?.features.bigNewsBadge}
              disabled={
                !config?.features.showBigNewsBanner || !config?.urls.news
              }
            />
          </section>

          {/* Share knowledge */}
          <ShareKnowledge meEmail={me.email} urls={config?.urls ?? {}} />

          {/* How it works */}
          <HowItWorks />
        </main>
      </div>
    </div>
  );
}
