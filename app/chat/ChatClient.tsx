// app/chat/ChatClient.tsx
"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Send, ArrowLeft, Loader2, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
type Sender = "user" | "assistant";
interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: Date;
}

type Me = { email: string | null; role: "admin" | "contributor" | null };

/** Discriminated union for n8n actions */
type N8nAction =
  | { type: "redirect"; url: string }
  | { type: "save_data"; data: unknown }
  | { type: "end_conversation"; message?: string };

type N8nChatResponse = {
  message?: string;
  actions?: N8nAction[];
};

function assertNever(x: never): never {
  throw new Error(`Unhandled action: ${JSON.stringify(x)}`);
}
// Add this component at the top of your file, before ChatClient
function FormattedText({ text }: { text: string }) {
  // Split on markdown patterns while preserving them
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);

  return (
    <>
      {parts.map((part, i) => {
        // Bold: **text**
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        // Italic: *text*
        if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        // Regular text
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
export default function ChatClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // --- user/session (from our Supabase-backed API) ---
  const [me, setMe] = useState<Me>({ email: null, role: null });
  const [loadingUser, setLoadingUser] = useState(true);

  // --- chat state ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [conversationId, setConversationId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const clientId = searchParams.get("client_id");

  // Smooth scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch the current user (Supabase session via cookies)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        const data = (await res.json()) as Me;
        if (!mounted) return;
        setMe(data);
        setLoadingUser(false);

        // Middleware should already gate this route, but double-guard:
        if (!data.email) {
          router.replace("/login");
          return;
        }

        // Initialize conversation once per mount
        const newId = `conv_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 11)}`;
        setConversationId(newId);
        await initializeConversation(newId, data.email, clientId);
      } catch {
        if (!mounted) return;
        setLoadingUser(false);
        router.replace("/login");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router, clientId]);

  async function initializeConversation(
    convId: string,
    userEmail: string | null,
    clientIdParam: string | null
  ) {
    // Simply set a hardcoded welcome message - no API call needed
    setMessages([
      {
        id: Date.now().toString(),
        text: "Hi! I'm here to help you share your insights. What would you like to discuss today?",
        sender: "assistant",
        timestamp: new Date(),
      },
    ]);
  }

  async function handleSendMessage() {
    if (!currentInput.trim() || isSending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: currentInput,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    const payloadText = currentInput;
    setCurrentInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/n8n/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: payloadText,
          conversationId,
          userId: me.email,
          clientId,
          messageHistory: messages.map((m) => ({
            text: m.text,
            sender: m.sender,
            timestamp: m.timestamp.toISOString(),
          })),
          sessionData: {
            userEmail: me.email,
            currentTime: new Date().toISOString(),
          },
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as N8nChatResponse;
        const assistantText =
          data?.message ||
          "I encountered an issue processing your message. Please try again.";

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            text: assistantText,
            sender: "assistant",
            timestamp: new Date(),
          },
        ]);

        if (Array.isArray(data?.actions) && data.actions.length > 0) {
          handleN8nActions(data.actions);
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "Sorry, I hit a technical issue. Please try again.",
          sender: "assistant",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  // Add this function right after the handleSendMessage function

  async function handleStopInterview() {
    if (isSending) return;

    // Extract username from email (before @ symbol)
    const username = me.email?.split("@")[0] || "";

    setIsSending(true);

    try {
      const response = await fetch("/api/n8n/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          userId: me.email,
          username,
          clientId,
          currentTime: new Date().toISOString(),
        }),
      });

      // Don't wait for full response processing - redirect immediately
      if (response.ok) {
        router.push("/"); // Redirect to homepage
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error("Error stopping interview:", error);
      // Still redirect on error, or show a toast notification
      router.push("/");
    } finally {
      setIsSending(false);
    }
  }
  function handleN8nActions(actions: N8nAction[]) {
    actions.forEach((action) => {
      switch (action.type) {
        case "redirect":
          setTimeout(() => router.push(action.url), 800);
          break;

        case "save_data":
          // Placeholder: you can persist action.data to your backend here
          console.log("Saving data:", action.data);
          break;

        case "end_conversation":
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                text: action.message || "Thank you for the conversation!",
                sender: "assistant",
                timestamp: new Date(),
              },
            ]);
          }, 400);
          break;

        default:
          assertNever(action as never);
      }
    });
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  // --- UI ---
  if (loadingUser) {
    return (
      <div className="min-h-dvh grid place-items-center px-6">
        <div className="flex items-center gap-2 text-neutral-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-900">
              AI Chat Assistant
            </h1>
          </div>
          <div className="w-16" />
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 overflow-y-auto">
        <div className="space-y-6">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${
                m.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                  m.sender === "user"
                    ? "bg-robinblue text-white"
                    : "bg-white text-gray-900 shadow-sm border"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  <FormattedText text={m.text} />
                </p>
                <p
                  className={`text-xs mt-1 ${
                    m.sender === "user" ? "text-white/80" : "text-gray-500"
                  }`}
                >
                  {m.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
          {isSending && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-900 shadow-sm border px-4 py-3 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t p-3 sm:p-4">
        <div className="max-w-4xl mx-auto flex gap-2 sm:gap-3">
          {/* Stop Interview Button */}
          <button
            onClick={handleStopInterview}
            disabled={isSending}
            className="bg-robinorange text-white px-3 sm:px-4 py-3 rounded-2xl hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap shrink-0"
            title="Stop Interview"
            type="button"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
            {/* Hide text on mobile, show on tablet+ */}
            <span className="hidden sm:inline text-sm">Stop Interview</span>
          </button>

          {/* Message Input */}
          <textarea
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type your message…"
            className="flex-1 px-3 sm:px-4 py-3 border text-black border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-robinblue focus:border-transparent resize-none min-h-[50px] max-h-32 text-sm sm:text-base"
            rows={1}
          />

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={!currentInput.trim() || isSending}
            className="bg-robinblue text-white px-4 sm:px-6 py-3 rounded-2xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
            type="button"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {/* Hide text on mobile, show on tablet+ */}
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
