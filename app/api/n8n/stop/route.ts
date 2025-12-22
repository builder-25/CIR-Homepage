// app/api/n8n/stop/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, userId, username, clientId, currentTime } = body;

    // Send to your n8n webhook endpoint for stopping interviews
    const n8nResponse = await fetch(process.env.N8N_STOP_WEBHOOK_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId,
        userId,
        username,
        clientId,
        currentTime,
      }),
    });

    if (!n8nResponse.ok) {
      throw new Error(`n8n returned ${n8nResponse.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error stopping interview:", error);
    return NextResponse.json(
      { success: false, error: "Failed to stop interview" },
      { status: 500 }
    );
  }
}
