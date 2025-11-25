import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut(); // clears auth cookies

    // Redirect back to login
    return NextResponse.redirect(new URL("/login", req.url));
  } catch (error) {
    console.error("Signout error:", error);
    // Still redirect to login even if signout fails
    return NextResponse.redirect(new URL("/login", req.url));
  }
}
