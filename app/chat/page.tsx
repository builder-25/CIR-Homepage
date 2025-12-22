// app/chat/page.tsx
import { Suspense } from "react";
import ChatClient from "./ChatClient";

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh grid place-items-center px-6">
          <div className="flex items-center gap-2 text-neutral-600">
            <span>Loading…</span>
          </div>
        </div>
      }
    >
      <ChatClient />
    </Suspense>
  );
}
