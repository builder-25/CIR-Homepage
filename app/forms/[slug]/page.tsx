// app/forms/[slug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import FormFrame from "./../../components/FormFrame";

// Allowed slugs as a union type - UPDATED
export type FormSlug = "report-upload" | "article-upload";

const VALID_SLUGS: FormSlug[] = ["report-upload", "article-upload"];

/** Map slugs to env variables - UPDATED */
function getEmbedUrlForSlug(slug: FormSlug): string | undefined {
  switch (slug) {
    case "report-upload":
      return process.env.AIRTABLE_EMBED_REPORT_UPLOAD; // or keep as AIRTABLE_EMBED_DOCUMENTS_UPLOAD if you don't want to rename the env var
    case "article-upload":
      return process.env.AIRTABLE_EMBED_ARTICLE_UPLOAD;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: FormSlug }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const titleMap: Record<FormSlug, string> = {
    "report-upload": "Report Upload",
    "article-upload": "Article Upload",
  };
  return {
    title: `${titleMap[slug]} • Submissions Hub`,
    robots: { index: false, follow: false },
  };
}

export default async function FormEmbedPage({
  params,
}: {
  params: Promise<{ slug: FormSlug }>;
}) {
  const { slug } = await params;

  if (!VALID_SLUGS.includes(slug)) {
    return (
      <div className="min-h-dvh grid place-items-center px-6">
        <div className="text-center max-w-md glass-card p-6">
          <h1 className="text-2xl font-semibold text-neutral-900">Not found</h1>
          <p className="text-neutral-600 mt-2">
            This form does not exist. Please check the link and try again.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-black/5 bg-gradient-to-b from-[var(--color-brand-primary)] to-[#077e83] px-4 py-2 text-white font-semibold shadow-md mt-4"
          >
            Go home →
          </Link>
        </div>
      </div>
    );
  }

  const iframeSrc = getEmbedUrlForSlug(slug);

  if (!iframeSrc) {
    return (
      <div className="min-h-dvh grid place-items-center px-6">
        <div className="text-center max-w-md glass-card p-6">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Form not configured
          </h1>
          <p className="text-neutral-600 mt-2">
            The embed URL for this form is missing. Please set the correct
            environment variable and reload.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-black/5 bg-gradient-to-b from-[var(--color-brand-primary)] to-[#077e83] px-4 py-2 text-white font-semibold shadow-md mt-4"
          >
            Go home →
          </Link>
        </div>
      </div>
    );
  }

  // Form metadata - UPDATED
  const formMetadata = {
    "report-upload": {
      title: "Report Upload",
      description: "Upload reports and supporting documents",
    },
    "article-upload": {
      title: "Article Upload",
      description: "Submit articles and documents for review",
    },
  };

  const metadata = formMetadata[slug];

  return (
    <>
      {/* Preconnect hints for faster Airtable loading */}
      <link
        rel="preconnect"
        href="https://airtable.com"
        crossOrigin="anonymous"
      />
      <link
        rel="preconnect"
        href="https://static.airtable.com"
        crossOrigin="anonymous"
      />
      <link rel="dns-prefetch" href="https://airtable.com" />

      <div className="min-h-dvh px-4 md:px-6 py-8 font-sans">
        <div className="mx-auto max-w-6xl glass-shell p-5 md:p-6 lg:p-8">
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              ← Back to home
            </Link>
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-semibold text-neutral-900">
              {metadata.title}
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              {metadata.description}
            </p>
          </div>

          <section className="mt-6">
            <div className="glass-card p-0 overflow-hidden">
              <FormFrame src={iframeSrc} title={metadata.title} tall />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
