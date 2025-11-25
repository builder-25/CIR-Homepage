"use client";

import { Upload, Bot, FileText } from "lucide-react";

function StepInline({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3 px-0 md:px-6">
      <div className="inline-grid place-items-center size-10 rounded-xl bg-[var(--tint-blue-12)] shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold text-neutral-900">{title}</div>
        <div className="text-sm text-neutral-600">{desc}</div>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section className="lg:col-span-12 glass-card p-5 md:p-6">
      <h3 className="text-xl font-semibold text-neutral-900 text-center">
        How it works
      </h3>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 md:divide-x md:divide-neutral-100">
        <StepInline
          icon={
            <Upload className="h-6 w-6 text-[var(--color-brand-primary)]" />
          }
          title="1. Upload"
          desc="Share your content in any format — files, links, or chat."
        />
        <StepInline
          icon={<Bot className="h-6 w-6 text-[var(--color-brand-primary)]" />}
          title="2. Process"
          desc="Our AI analyzes and structures your knowledge."
        />
        <StepInline
          icon={
            <FileText className="h-6 w-6 text-[var(--color-brand-primary)]" />
          }
          title="3. Create"
          desc="Get polished, on-brand content ready to use."
        />
      </div>
    </section>
  );
}
