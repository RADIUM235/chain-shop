"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!sessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/download?session_id=${sessionId}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate download link");
      }

      window.open(data.downloadUrl, "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center">
        {/* Success Animation */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-white border-3 border-black flex items-center justify-center mb-6">
            <svg
              className="w-12 h-12 text-black"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">
            Payment Successful! 🎉
          </h1>
          <p className="text-lg text-black/70 mb-2">
            Thank you for your purchase. A confirmation email has been sent to your inbox.
          </p>
          <p className="text-sm text-black/50">
            You can download your ebook below. The download link expires in 5
            minutes — you can always generate a new one.
          </p>
        </div>

        {/* Download Button */}
        {sessionId ? (
          <div className="space-y-4">
            <button
              onClick={handleDownload}
              disabled={isLoading}
              className="w-full py-4 bg-black text-white font-semibold border-2 border-black hover:bg-white hover:text-black transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {isLoading ? "Generating link..." : "📥 Download Your Ebook"}
            </button>

            {error && (
              <p className="text-black text-sm bg-white border-2 border-black p-3">
                {error}
              </p>
            )}
          </div>
        ) : (
          <div className="p-4 bg-white border-2 border-black">
            <p className="text-black text-sm">
              Missing session ID. If you completed a purchase, please check your
              email for the download link.
            </p>
          </div>
        )}

        {/* Back to store */}
        <div className="mt-10 pt-8 border-t-3 border-black">
          <Link
            href="/store"
            className="text-black hover:underline text-sm"
          >
            ← Back to Store
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-black">Loading...</div>
        </div>
      }
    >
      <SuccessPageContent />
    </Suspense>
  );
}
