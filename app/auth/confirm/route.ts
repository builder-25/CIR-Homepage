// app/auth/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/server";
import type { EmailOtpType } from "@supabase/supabase-js";

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

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token_hash = url.searchParams.get("token_hash");
    const type = url.searchParams.get("type") as EmailOtpType | null;
    const next = url.searchParams.get("next") ?? "/";

    const toLogin = (reason?: string) =>
      NextResponse.redirect(
        new URL(`/login${reason ? `?${reason}=1` : ""}`, req.url)
      );

    if (!token_hash || !type) return toLogin("missing_code");

    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (error) {
      console.error("OTP verification error:", error);
      return toLogin("auth_error");
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const email = user?.email?.toLowerCase() ?? "";
    const isAdmin = ADMIN_EMAILS.includes(email);

    if (!isAdmin && !isAllowedDomain(email)) {
      await supabase.auth.signOut();
      return toLogin("unauthorized");
    }

    // Safe redirect (resolves relative `next` against current URL)
    return NextResponse.redirect(new URL(next, req.url));
  } catch (error) {
    console.error("Confirm route error:", error);
    return NextResponse.redirect(new URL("/login?error=1", req.url));
  }
}
