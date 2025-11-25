// components/FormFrame.tsx
"use client";

import { useState, useEffect, useRef } from "react";

type Props = {
  src: string;
  title: string;
  className?: string;
  tall?: boolean;
};

export default function FormFrame({
  src,
  title,
  className = "",
  tall = true,
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [showSlowWarning, setShowSlowWarning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Intersection Observer - load iframe when near viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();

          // Start timer to show slow loading message
          loadTimerRef.current = setTimeout(() => {
            if (!loaded) {
              setShowSlowWarning(true);
            }
          }, 5000);
        }
      },
      {
        rootMargin: "100px",
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
      if (loadTimerRef.current) {
        clearTimeout(loadTimerRef.current);
      }
    };
  }, [loaded]);

  const handleLoad = () => {
    setLoaded(true);
    setShowSlowWarning(false);
    if (loadTimerRef.current) {
      clearTimeout(loadTimerRef.current);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Enhanced loading state */}
      {!loaded && shouldLoad && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="text-center max-w-md px-4">
            <div className="animate-spin w-12 h-12 border-3 border-teal-600/20 border-t-teal-600 rounded-full mx-auto mb-4"></div>
            <p className="text-base text-neutral-700 font-medium">
              Loading form...
            </p>
            <p className="text-sm text-neutral-500 mt-1">
              {showSlowWarning
                ? "Still loading... Airtable forms can take a moment to initialize."
                : "This may take a few moments"}
            </p>

            {showSlowWarning && (
              <p className="text-xs text-neutral-400 mt-2">
                The form will be faster after first load
              </p>
            )}
          </div>
        </div>
      )}

      {/* Initial placeholder before intersection */}
      {!shouldLoad && (
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-8 h-8 text-teal-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-sm text-neutral-600 font-medium">
              Form ready to load
            </p>
          </div>
        </div>
      )}

      {/* Background shimmer */}
      {!loaded && shouldLoad && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-neutral-100 via-neutral-50 to-neutral-100" />
      )}

      {/* Responsive container */}
      <div className="w-full">
        {shouldLoad && (
          <iframe
            title={title}
            src={src}
            className={`w-full ${
              tall
                ? "min-h-[70dvh] md:min-h-[80dvh]"
                : "min-h-[60dvh] md:min-h-[70dvh]"
            } border-0 transition-opacity duration-500 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={handleLoad}
            allow="clipboard-write; microphone; camera"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )}
      </div>
    </div>
  );
}
