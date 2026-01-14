// app/coming-soon/page.tsx
import Link from "next/link";

export default function ComingSoonPage() {
  return (
    <main className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-16">
      <div className="glass-card max-w-lg w-full p-12 md:p-16 text-center">
        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-robinblue/10 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-robinblue"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Coming Soon - THE MAIN EVENT */}
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-robinblue to-robinorange bg-clip-text text-transparent mb-16">
          Coming Soon
        </h1>

        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-xl)] bg-robinblue text-white font-medium hover:bg-robinblue/90 transition-all hover:shadow-lg"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Hub
        </Link>
      </div>
    </main>
  );
}
