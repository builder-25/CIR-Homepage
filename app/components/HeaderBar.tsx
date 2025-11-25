"use client";

import { useState, useEffect, useRef } from "react";
import { LogOut, User, Lock, Menu, X } from "lucide-react";
import Image from "next/image";
import RobinLogo from "../Assets/images/robin-logo.png";

type Props = {
  meEmail: string;
  meRole: "admin" | "contributor";
  adminUrl?: string;
  onSignOut: () => Promise<void>;
};

export default function HeaderBar({
  meEmail,
  meRole,
  adminUrl,
  onSignOut,
}: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <header className="relative">
      <div className="flex items-center justify-between gap-4">
        {/* Left side - Logo and Title */}
        <div className="flex items-center gap-3 min-w-0">
          <Image
            src={RobinLogo}
            alt="Robin logo"
            width={36}
            height={36}
            className="rounded-xl"
            style={{ boxShadow: "0 6px 18px rgba(0,0,0,.12)" }}
            priority
          />
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-neutral-900 m-0">
              Submissions Hub
            </h1>
          </div>
        </div>

        {/* Desktop view - show all items */}
        <div className="hidden md:flex items-center gap-3 min-w-0">
          {meRole === "admin" && adminUrl && (
            <a
              href={adminUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-900 hover:text-[var(--color-brand-primary)] transition-colors"
            >
              <Lock className="h-4 w-4" />
              Admin
            </a>
          )}
          <div className="h-5 w-px bg-neutral-200" />
          <div className="flex items-center gap-2 text-sm text-neutral-700 min-w-0">
            <User className="h-4 w-4 shrink-0" />
            <span className="truncate max-w-[220px]" title={meEmail}>
              {meEmail}
            </span>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="rounded-lg border border-black/5 bg-gradient-to-b from-[var(--color-brand-primary)] to-[#077e83] px-3 py-2 text-white text-sm font-semibold shadow-md hover:brightness-105 active:translate-y-px transition-all"
          >
            <span className="inline-flex items-center gap-1">
              <LogOut className="h-4 w-4" /> Sign out
            </span>
          </button>
        </div>

        {/* Mobile view - hamburger menu button */}
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? (
            <X className="h-6 w-6 text-neutral-900" />
          ) : (
            <Menu className="h-6 w-6 text-neutral-900" />
          )}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {isMenuOpen && (
        <div
          ref={menuRef}
          className="md:hidden absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 z-50"
        >
          {/* User info */}
          <div className="px-4 py-3 border-b border-neutral-200">
            <div className="flex items-center gap-2 text-sm text-neutral-700">
              <User className="h-4 w-4 shrink-0" />
              <span className="truncate" title={meEmail}>
                {meEmail}
              </span>
            </div>
          </div>

          {/* Admin link */}
          {meRole === "admin" && adminUrl && (
            <a
              href={adminUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <Lock className="h-4 w-4" />
              Admin
            </a>
          )}

          {/* Sign out button */}
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              onSignOut();
            }}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 text-left transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
