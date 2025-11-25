"use client";

import { FileText, Newspaper } from "lucide-react";
import { CTACard } from "./CTACard";

type Props = {
  meEmail: string;
  urls: {
    articleUpload?: string;
    reportUpload?: string;
  };
};

export default function ShareKnowledge({ meEmail, urls }: Props) {
  return (
    <section className="lg:col-span-12">
      <div className="glass-card p-8 md:p-12 lg:p-16 max-w-6xl mx-auto">
        {/* Upload Section */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-start gap-6 md:gap-8">
            {/* Section Header */}
            <h3 className="text-sm sm:text-base sm:text-center lg:text-lg font-semibold text-neutral-900 tracking-wide glass-section-blue sm:w-1/3 flex-shrink-0">
              Uploads
            </h3>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 md:gap-6 lg:gap-8 sm:w-2/3">
              <CTACard
                title="Upload Report"
                icon={FileText}
                iconColor="blue"
                href="/forms/report-upload"
              />

              <CTACard
                title="Upload Article"
                icon={Newspaper}
                iconColor="blue"
                href="/forms/article-upload"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
