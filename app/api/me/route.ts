// app/api/me/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/app/utils/server";

function parseList(raw?: string) {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}
const ADMIN_EMAILS = parseList(process.env.ADMIN_EMAILS);

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ email: null, role: null });
    }

    const email = user.email.toLowerCase();
    const role: "admin" | "contributor" = ADMIN_EMAILS.includes(email)
      ? "admin"
      : "contributor";

    return NextResponse.json({ email, role });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ email: null, role: null });
  }
}
