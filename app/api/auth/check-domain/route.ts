import { NextResponse } from "next/server";
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
  const domain = email.slice(at).toLowerCase();
  if (ALLOWED_EMAIL_DOMAINS.length === 0) return true;
  return ALLOWED_EMAIL_DOMAINS.some(
    (d) => domain === (d.startsWith("@") ? d : `@${d}`),
  );
}

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ authorized: false, reason: "no_user" });
    }

    const email = user.email.toLowerCase();
    const isAdmin = ADMIN_EMAILS.includes(email);
    const domainAllowed = isAllowedDomain(email);

    return NextResponse.json({
      authorized: isAdmin || domainAllowed,
      reason: isAdmin ? "admin" : domainAllowed ? "domain" : "unauthorized",
    });
  } catch (error) {
    console.error("Domain check error:", error);
    return NextResponse.json({ authorized: false, reason: "error" });
  }
}
