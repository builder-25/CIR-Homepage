"use client";

import { Zap } from "lucide-react";

interface BigNewsCardProps {
  href?: string;
  badge?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export function BigNewsCard({
  href,
  badge = "Updates",
  disabled,
  onClick,
}: BigNewsCardProps) {
  const inner = (
    <div className="relative w-full h-full">
      <div aria-hidden className="absolute inset-0 bg-[--gradient-brand]" />
      <div aria-hidden className="absolute inset-0 bg-black/10" />
      <div
        aria-hidden
        className="absolute -inset-x-20 -top-14 h-24 bg-white/10 rotate-6"
      />
      <div className="relative z-10 px-5 py-4 text-robinblue">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-2.5 py-1">
            <Zap className="h-3.5 w-3.5" />
            <span className="text-[11px] font-semibold tracking-wide uppercase">
              {badge}
            </span>
          </span>
          {disabled && (
            <span className="rounded-full bg-yellow-300 text-black text-[11px] font-semibold px-2 py-0.5">
              Coming Soon
            </span>
          )}
          {!disabled && (
            <span className="text-sm/none text-white/90">
              Time-sensitive updates and links.
            </span>
          )}
          <span className="ml-auto text-sm font-semibold underline decoration-white/40 underline-offset-4">
            {disabled ? "—" : "Open ↗"}
          </span>
        </div>
      </div>
    </div>
  );

  if (disabled) return <div className="h-[64px]">{inner}</div>;

  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className="block h-[64px]"
      aria-label="Open latest news"
    >
      {inner}
    </a>
  ) : (
    <button
      type="button"
      onClick={onClick}
      className="block w-full h-[64px] text-left"
      aria-label="Open latest news"
    >
      {inner}
    </button>
  );
}
