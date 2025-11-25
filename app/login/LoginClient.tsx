"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import robinLogo from "../Assets/images/robin.svg";

type Status = "idle" | "sending" | "sent" | "error";

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export default function LoginClient() {
  const searchParams = useSearchParams();

  // UI state
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // read messages appended by /auth/confirm (e.g. ?unauthorized=1)
  const flags = useMemo(
    () => ({
      unauthorized: searchParams.get("unauthorized"),
      auth_error: searchParams.get("auth_error"),
      missing_code: searchParams.get("missing_code"),
    }),
    [searchParams]
  );

  useEffect(() => {
    if (flags.unauthorized)
      setInfo("Your email is not authorized for this tool.");
    else if (flags.auth_error)
      setInfo("We could not complete sign-in. Please try again.");
    else if (flags.missing_code)
      setInfo(
        "The login link was invalid or expired. Please request a new one."
      );
  }, [flags]);

  // simple email validator
  function isValidEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    setInfo(null);

    const normalized = email.trim().toLowerCase();
    if (!isValidEmail(normalized)) {
      setStatus("error");
      setError("Please enter a valid email address.");
      return;
    }

    try {
      const res = await fetch("/api/auth/send-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized }),
      });

      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        throw new Error("Unexpected response from server. Please try again.");
      }

      const payload: unknown = await res.json();

      if (!res.ok) {
        let reason: string | undefined;
        if (isObject(payload) && typeof payload.reason === "string") {
          reason = payload.reason;
        }

        if (reason === "unauthorized_domain") {
          throw new Error("This email is not authorized for access.");
        }
        if (reason === "invalid_email") {
          throw new Error("Please enter a valid email address.");
        }
        if (reason === "send_failed") {
          const extra =
            isObject(payload) && typeof payload.message === "string"
              ? ` ${payload.message}`
              : "";
          throw new Error(
            `Could not send the magic link. Please try again.${
              extra ? ` (${extra})` : ""
            }`
          );
        }
        throw new Error("Unexpected error. Please try again.");
      }

      setStatus("sent");
      setInfo("Check your email for the magic link.");
    } catch (err: unknown) {
      setStatus("error");
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to send magic link.");
      }
    }
  }

  return (
    <div className="min-h-dvh grid place-items-center px-6 font-sans bg-gradient-to-b from-white via-teal-50/30 to-white">
      <main className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white/90 shadow-xl backdrop-blur-md p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Image
            src={robinLogo}
            alt="Robin logo"
            width={40}
            height={40}
            className="rounded-xl"
            style={{ boxShadow: "0 6px 18px rgba(0,0,0,.12)" }}
          />
          <div>
            <h1 className="m-0 text-xl font-semibold text-slate-900">
              Sign in
            </h1>
            <p className="text-sm text-slate-500">
              Access the internal submissions hub
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <label
            htmlFor="email"
            className="text-sm font-semibold text-slate-800"
          >
            Work email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@client.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!error}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-base text-slate-900 outline-none transition focus-visible:ring-2 focus-visible:ring-teal-500/40"
          />

          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-teal-700/10 bg-gradient-to-b from-teal-600 to-teal-700 px-4 py-3 text-white font-semibold shadow-md transition hover:brightness-105 active:translate-y-px disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {status === "sending" ? <Spinner /> : <LockIcon />}
            {status === "sending" ? "Sending…" : "Send magic link"}
          </button>
        </form>

        {/* Messages */}
        {info && (
          <p role="status" className="mt-3 text-sm text-emerald-600">
            {info}
          </p>
        )}
        {status === "sent" && !info && (
          <p role="status" className="mt-3 text-sm text-emerald-600">
            Check your email for the magic link.
          </p>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <p className="mt-4 text-xs text-slate-500">
          By continuing you agree to internal usage policies. If you can’t
          access the tool, contact an admin.
        </p>
      </main>
    </div>
  );
}

/* tiny inline icons */
function LockIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 10V8a5 5 0 1110 0v2"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <rect
        x="4"
        y="10"
        width="16"
        height="10"
        rx="2.5"
        stroke="white"
        strokeWidth="1.6"
      />
    </svg>
  );
}
function Spinner() {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 24 24" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="white"
        strokeOpacity=".35"
        strokeWidth="3"
        fill="none"
      />
      <path
        d="M21 12a9 9 0 00-9-9"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
