// app/api/n8n/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/server";

function parseList(raw?: string) {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}
const ADMIN_EMAILS = parseList(process.env.ADMIN_EMAILS);

type UserRole = "admin" | "contributor";

type N8nAction =
  | { type: "redirect"; url: string }
  | { type: "save_data"; data: unknown }
  | { type: "end_conversation"; message?: string };

interface ChatApiSuccess {
  message: string;
  actions: N8nAction[];
  conversationId: string;
  metadata: Record<string, unknown>;
}

interface ChatApiRequestBody {
  message: string;
  conversationId: string;
  userId?: string | null;
  clientId?: string | null;
  messageHistory?: Array<{
    text: string;
    sender: "user" | "assistant";
    timestamp: string; // ISO
  }>;
  sessionData?: Record<string, unknown>;
}

type N8nResponseItem = {
  response?: unknown;
  data?: unknown;
  payload?: unknown;
  message?: unknown;
  actions?: unknown;
  metadata?: unknown;
};
type N8nResponse = N8nResponseItem | N8nResponseItem[];

// ---------- small, reusable type guards (no `any`) ----------
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
function hasProp<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return isObject(obj) && key in obj;
}
function getString(obj: unknown): string | undefined {
  return typeof obj === "string" ? obj : undefined;
}
function getArray(obj: unknown): unknown[] | undefined {
  return Array.isArray(obj) ? obj : undefined;
}
function normalizeActions(arr: unknown[]): N8nAction[] {
  return arr
    .filter(
      (a): a is Record<string, unknown> => isObject(a) && hasProp(a, "type")
    )
    .map((a) => a as Record<string, unknown> & { type: unknown })
    .filter((a): a is N8nAction => {
      const t = a.type;
      return t === "redirect" || t === "save_data" || t === "end_conversation";
    })
    .map((a) => a as N8nAction);
}
function maybeParseJSON(v: unknown): unknown {
  const s = getString(v);
  if (!s) return v;
  const trimmed = s.trim();
  const looksJson =
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"));
  if (!looksJson) return v;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return v;
  }
}
// ------------------------------------------------------------

export async function GET() {
  return NextResponse.json({
    message: "n8n Chat API is running (Supabase auth)",
    methods: ["POST"],
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = user.email.toLowerCase();
    const userRole: UserRole = ADMIN_EMAILS.includes(userEmail)
      ? "admin"
      : "contributor";

    // Parse incoming payload safely
    const username =
      user.user_metadata?.username ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "Unknown User";

    let body: unknown = null;
    try {
      body = await request.json();
    } catch {
      body = null;
    }

    const b = isObject(body) ? (body as Record<string, unknown>) : {};
    const message = getString(b.message);
    const conversationId = getString(b.conversationId);
    const userId = getString(b.userId) ?? null;
    const clientId = getString(b.clientId) ?? null;
    const messageHistory = getArray(b.messageHistory) ?? [];
    const sessionData = (
      isObject(b.sessionData) ? b.sessionData : {}
    ) as Record<string, unknown>;

    if (!message || !conversationId) {
      return NextResponse.json(
        { error: "Missing required fields: message, conversationId" },
        { status: 400 }
      );
    }

    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL!;
    const N8N_WEBHOOK_TOKEN = process.env.N8N_WEBHOOK_TOKEN;

    const ipHeader =
      getString(request.headers.get("x-forwarded-for"))
        ?.split(",")[0]
        ?.trim() ||
      getString(request.headers.get("x-real-ip")) ||
      undefined;

    const n8nPayload = {
      message,
      conversationId,
      userId: userId || userEmail,
      username,
      clientId,
      messageHistory,
      sessionData: {
        ...sessionData,
        serverTimestamp: new Date().toISOString(),
        userEmail,
        userRole,
        username,
      },
      metadata: {
        source: "chat_interface" as const,
        userAgent: getString(request.headers.get("user-agent")) ?? undefined,
        ip: ipHeader,
      },
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (N8N_WEBHOOK_TOKEN)
      headers.Authorization = `Bearer ${N8N_WEBHOOK_TOKEN}`;

    const n8nRes = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(n8nPayload),
      cache: "no-store",
    });

    if (!n8nRes.ok) {
      const fallback: ChatApiSuccess = {
        message:
          message === "INIT_CONVERSATION"
            ? "Hi! I'm your AI assistant. How can I help you today? (Note: fallback mode)"
            : "I understand. Can you tell me more about that? (Note: n8n not available)",
        actions: [],
        conversationId,
        metadata: { fallbackMode: true, n8nStatus: n8nRes.status },
      };
      return NextResponse.json(fallback);
    }

    const raw = await n8nRes.text();
    console.log("Raw n8n response:", raw);
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      const fallback: ChatApiSuccess = {
        message: "Sorry, I encountered an invalid response format.",
        actions: [],
        conversationId,
        metadata: { error: "JSON parse error", rawResponse: raw },
      };
      return NextResponse.json(fallback);
    }
    console.log("Parsed n8n response:", parsed);
    const items: N8nResponseItem[] = Array.isArray(parsed)
      ? (parsed as N8nResponseItem[])
      : [parsed as N8nResponseItem];

    // FIXED: Prioritize AI response over user message
    let assistantText: string | undefined;
    let actions: N8nAction[] = [];
    let metadata: Record<string, unknown> = {};

    for (const item of items) {
      // PRIORITY 1: Direct 'response' field (your n8n format)
      if (!assistantText && hasProp(item, "response")) {
        const directResponse = getString(item.response);
        if (directResponse && directResponse.trim()) {
          assistantText = directResponse.trim();
        }
      }

      // PRIORITY 2: Check nested structures only if no direct response found
      if (!assistantText) {
        const rawResp =
          (hasProp(item, "data") ? item.data : undefined) ??
          (hasProp(item, "payload") ? item.payload : undefined);

        const resp = maybeParseJSON(rawResp);

        if (isObject(resp)) {
          const r = resp as Record<string, unknown>;
          const nestedResponse = getString(r.response);
          if (nestedResponse) {
            assistantText = nestedResponse;
          } else {
            const fallbackMessage = getString(r.message);
            if (fallbackMessage) {
              assistantText = fallbackMessage;
            }
          }
        } else {
          // Raw string fallback
          const rawStr = getString(rawResp);
          if (rawStr && rawStr.trim()) {
            assistantText = rawStr.trim();
          }
        }
      }

      // Handle actions
      if (
        !actions.length &&
        hasProp(item, "actions") &&
        getArray(item.actions)
      ) {
        actions = normalizeActions(getArray(item.actions)!);
      }

      // Handle metadata
      if (
        !Object.keys(metadata).length &&
        hasProp(item, "metadata") &&
        isObject(item.metadata)
      ) {
        metadata = item.metadata as Record<string, unknown>;
      }
    }

    // Final fallback
    if (!assistantText) assistantText = "I received your message.";

    const ok: ChatApiSuccess = {
      message: assistantText,
      actions,
      conversationId,
      metadata,
    };
    return NextResponse.json(ok);
  } catch (error: unknown) {
    const msg =
      process.env.NODE_ENV === "development"
        ? error instanceof Error
          ? error.message
          : String(error)
        : "Internal server error";

    return NextResponse.json(
      {
        message:
          "I apologize, but I encountered a technical issue. Please try again.",
        error: msg,
      },
      { status: 500 }
    );
  }
}
