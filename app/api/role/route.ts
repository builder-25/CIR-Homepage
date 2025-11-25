// app/api/role/route.ts
import { NextResponse } from "next/server";

function parseList(raw: string | undefined) {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

const ADMIN_EMAILS = parseList(process.env.ADMIN_EMAILS);
const ALLOWED_EMAIL_DOMAINS = parseList(process.env.ALLOWED_EMAIL_DOMAINS);

function isAllowedDomain(email: string) {
  const domain = email.substring(email.lastIndexOf("@")).toLowerCase(); // includes '@'
  // allow '@client.org' items, but also if they configured bare domains like 'client.org'
  return ALLOWED_EMAIL_DOMAINS.some((d) => {
    const want = d.startsWith("@") ? d : `@${d}`;
    return domain === want;
  });
}

export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as { email?: string };
    const userEmail = (email ?? "").toLowerCase().trim();

    if (!userEmail || !userEmail.includes("@")) {
      return NextResponse.json(
        { ok: false, reason: "invalid" },
        { status: 400 }
      );
    }

    // 1) Domain gate
    if (ALLOWED_EMAIL_DOMAINS.length > 0 && !isAllowedDomain(userEmail)) {
      return NextResponse.json(
        { ok: false, reason: "unauthorized" },
        { status: 403 }
      );
    }

    // 2) Role
    const role: "admin" | "contributor" = ADMIN_EMAILS.includes(userEmail)
      ? "admin"
      : "contributor";

    return NextResponse.json({ ok: true, role }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }
}
