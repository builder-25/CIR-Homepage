// components/HeaderBarClient.tsx
"use client";

import HeaderBar from "./HeaderBar";

type Props = {
  meEmail: string;
  meRole: "admin" | "contributor";
  adminUrl?: string;
};

export default function HeaderBarClient({ meEmail, meRole, adminUrl }: Props) {
  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <HeaderBar
      meEmail={meEmail}
      meRole={meRole}
      adminUrl={adminUrl}
      onSignOut={handleSignOut}
    />
  );
}
