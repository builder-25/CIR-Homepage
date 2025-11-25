"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { useMemo } from "react";
import type { JSX } from "react";

type IconType = LucideIcon | ((props: { className?: string }) => JSX.Element);

interface CTACardProps {
  title: string;
  icon: IconType;
  /** Icon circle background color (brand color) */
  iconColor?: "blue" | "orange" | "green";
  href?: string;
  external?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  badge?: string;
  testId?: string;
}

export function CTACard({
  title,
  icon: Icon,
  iconColor = "blue",
  href,
  external = false,
  onClick,
  disabled = false,
  badge = "Coming soon",
  testId,
}: CTACardProps) {
  const colorMap = {
    blue: "bg-robinblue",
    orange: "bg-robinorange",
    green: "bg-robingreen",
  };

  const className = useMemo(
    () =>
      [
        "group flex flex-col items-center text-center gap-5 transition-all duration-300 ease-out",
        disabled
          ? "opacity-40 cursor-not-allowed pointer-events-none"
          : "hover:-translate-y-1 cursor-pointer",
      ].join(" "),
    [disabled]
  );

  const content = (
    <>
      {/* Circular icon */}
      <div
        className={`
          relative w-20 h-20 rounded-full ${colorMap[iconColor]} 
          flex items-center justify-center
          shadow-lg
          transition-all duration-300 ease-out
          ${!disabled ? "group-hover:scale-105 group-hover:shadow-xl" : ""}
        `}
      >
        <Icon className="w-9 h-9 text-white" strokeWidth={1.5} />

        {disabled && (
          <span className="absolute -top-2 -right-2 text-[10px] px-2 py-0.5 rounded-full bg-yellow-300 text-black font-semibold shadow-sm">
            {badge}
          </span>
        )}
      </div>

      {/* Label */}
      <p
        className={`
          text-[15px] font-medium text-neutral-700 max-w-[140px] leading-snug
          transition-colors duration-200
          ${!disabled ? "group-hover:text-neutral-900" : ""}
        `}
      >
        {title}
      </p>
    </>
  );

  // Link mode (external)
  if (href && external) {
    return (
      <a
        data-testid={testId}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={title}
        aria-disabled={disabled || undefined}
        className={className}
      >
        {content}
      </a>
    );
  }

  // Link mode (internal)
  if (href) {
    return (
      <Link
        data-testid={testId}
        href={href}
        aria-label={title}
        aria-disabled={disabled || undefined}
        className={className}
      >
        {content}
      </Link>
    );
  }

  // Button mode
  return (
    <button
      data-testid={testId}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={title}
      className={className}
    >
      {content}
    </button>
  );
}
