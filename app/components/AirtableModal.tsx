// components/AirtableModal.tsx
"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

export function AirtableModal({
  open,
  onClose,
  src,
  title = "Form",
}: {
  open: boolean;
  onClose: () => void;
  src: string | null; // e.g. "https://airtable.com/embed/appeFFn8W3FAVZEQI/pagwpWqFqGBbIQ9MO/form"
  title?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !src) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <button
        aria-label="Close"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-[95vw] h-[85vh] max-w-5xl rounded-2xl bg-white shadow-2xl border border-black/10 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
          <h2 className="text-sm font-semibold text-neutral-900 truncate">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-sm hover:bg-neutral-50"
          >
            <X className="h-4 w-4" />
            Close
          </button>
        </div>

        {/* Embed */}
        <iframe
          title={title}
          className="w-full h-[calc(85vh-48px)]"
          src={src}
          frameBorder={0}
          style={{ background: "transparent" }}
        />
      </div>
    </div>
  );
}
