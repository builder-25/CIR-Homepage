// app/api/auth/send-magic-link/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function parseList(raw?: string) {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}
const ADMIN_EMAILS = parseList(process.env.ADMIN_EMAILS);
const ALLOWED_EMAIL_DOMAINS = parseList(process.env.ALLOWED_EMAIL_DOMAINS);

function isAllowedDomain(email: string) {
  const at = email.lastIndexOf("@");
  if (at === -1) return false;
  const domain = email.slice(at).toLowerCase();
  if (ALLOWED_EMAIL_DOMAINS.length === 0) return true;
  return ALLOWED_EMAIL_DOMAINS.some(
    (d) => domain === (d.startsWith("@") ? d : `@${d}`)
  );
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

interface SendMagicLinkBody {
  email?: string;
}

// Quick ping so you can visit this URL in the browser and confirm JSON behavior
export async function GET() {
  return NextResponse.json({ ok: true, route: "send-magic-link" });
}

export async function POST(req: Request) {
  try {
    // Validate env early (if missing, don’t throw HTML error pages)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) {
      return NextResponse.json(
        {
          ok: false,
          reason: "server_misconfig",
          message: "Missing Supabase env vars",
        },
        { status: 500 }
      );
    }

    // Safe body parsing without `any`
    let body: unknown = null;
    try {
      body = await req.json();
    } catch {
      body = null;
    }
    const { email } = (
      isObject(body) ? (body as SendMagicLinkBody) : {}
    ) as SendMagicLinkBody;

    const normalized = (email ?? "").trim().toLowerCase();

    if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return NextResponse.json(
        { ok: false, reason: "invalid_email" },
        { status: 400 }
      );
    }

    // Admins bypass domain allowlist
    const isAdmin = ADMIN_EMAILS.includes(normalized);
    if (!isAdmin && !isAllowedDomain(normalized)) {
      return NextResponse.json(
        { ok: false, reason: "unauthorized_domain" },
        { status: 403 }
      );
    }

    const supabase = createClient(url, anon);

    const { error } = await supabase.auth.signInWithOtp({
      email: normalized,
      // DO NOT pass emailRedirectTo — email template points to /auth/confirm
    });

    if (error) {
      return NextResponse.json(
        { ok: false, reason: "send_failed", message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        ok: false,
        reason: "bad_request",
        message,
      },
      { status: 400 }
    );
  }
}
