// app/login/page.tsx
import { Suspense } from "react";
import LoginClient from "./LoginClient";

// Optional: uncomment to avoid any SSG
// export const dynamic = "force-dynamic";

export default function LoginPage() {
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
      <LoginClient />
    </Suspense>
  );
}
