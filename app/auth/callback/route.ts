// app/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/server";

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
  const domain = email.slice(at).toLowerCase(); // includes '@'
  return ALLOWED_EMAIL_DOMAINS.length === 0
    ? true
    : ALLOWED_EMAIL_DOMAINS.some((d) => {
        const want = d.startsWith("@") ? d : `@${d}`;
        return domain === want;
      });
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const toLogin = (reason?: string) =>
      NextResponse.redirect(
        new URL(`/login${reason ? `?${reason}=1` : ""}`, req.url)
      );

    if (!code) return toLogin("missing_code");

    const supabase = await createClient();

    // Exchange the code AND set auth cookies on the response automatically
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
      code
    );
    if (exchangeError) {
      console.error("Auth exchange error:", exchangeError);
      return toLogin("auth_error");
    }

    // Optional: domain/admin gate *before* letting them in
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const email = user?.email?.toLowerCase() ?? "";
    const isAdmin = ADMIN_EMAILS.includes(email);

    if (!isAdmin && !isAllowedDomain(email)) {
      await supabase.auth.signOut(); // clears cookies
      return toLogin("unauthorized");
    }

    // Success → send to home. Middleware will now see valid cookies and allow.
    return NextResponse.redirect(new URL("/", req.url));
  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.redirect(new URL("/login?error=1", req.url));
  }
}
