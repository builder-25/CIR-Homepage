"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useState, Suspense } from "react";

// Environment variables for Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function ConfirmContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const handleConfirm = async () => {
    if (!tokenHash || !type) return;

    setStatus("loading");
    setErrorMessage("");

    const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

    try {
      // Step 1: Verify the OTP
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as "email" | "signup" | "recovery" | "email_change",
      });

      if (error) {
        console.error("Verification error:", error);
        setStatus("error");

        if (error.message.includes("expired")) {
          setErrorMessage(
            "This link has expired. Please request a new one from the login page.",
          );
        } else if (error.message.includes("invalid")) {
          setErrorMessage(
            "This link is no longer valid. It may have already been used. Please request a new one.",
          );
        } else {
          setErrorMessage(error.message);
        }
        return;
      }

      // Step 2: Check domain authorization via API
      const authCheck = await fetch("/api/auth/check-domain");
      const authResult = await authCheck.json();

      if (!authResult.authorized) {
        // Sign them out and show error
        await supabase.auth.signOut();
        setStatus("error");
        setErrorMessage(
          "Your email domain is not authorized to access this application. Please contact an administrator.",
        );
        return;
      }

      // Step 3: Success! Redirect to home
      router.push("/");
    } catch (err) {
      console.error("Unexpected error:", err);
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  };

  // Invalid link (missing params)
  if (!tokenHash || !type) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-brand-ink mb-3">
            Invalid Link
          </h1>
          <p className="text-gray-600 mb-6">
            This sign-in link appears to be invalid or incomplete.
          </p>
          <a
            href="/login"
            className="inline-block px-6 py-3 bg-gradient-to-r from-robinblue to-robinorange text-white font-medium rounded-full hover:opacity-90 transition-opacity"
          >
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card max-w-md w-full p-8 text-center">
        {/* Logo/Icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-robinblue to-robinorange flex items-center justify-center shadow-lg">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold text-brand-ink mb-3">
          Confirm Sign In
        </h1>

        <p className="text-gray-600 mb-8">
          Click the button below to complete your sign in to the Submissions
          Hub.
        </p>

        {/* Error message */}
        {status === "error" && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {errorMessage}
          </div>
        )}

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          disabled={status === "loading"}
          className="w-full py-4 px-6 bg-gradient-to-r from-robinblue to-robinorange text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
        >
          {status === "loading" ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Signing you in...
            </span>
          ) : (
            "Complete Sign In"
          )}
        </button>

        {/* Help text */}
        <p className="mt-6 text-sm text-gray-500">
          Having trouble?{" "}
          <a href="/login" className="text-robinblue hover:underline">
            Request a new link
          </a>
        </p>
      </div>
    </div>
  );
}

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-robinblue to-robinorange flex items-center justify-center shadow-lg animate-pulse">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-brand-ink mb-3">
          Loading...
        </h1>
      </div>
    </div>
  );
}

// Main export with Suspense wrapper (required for useSearchParams)
export default function ConfirmPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ConfirmContent />
    </Suspense>
  );
}
