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
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center px-6 transition-colors duration-300">
      <div className="max-w-lg w-full text-center">
        {/* Success Animation */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-white dark:bg-black border-3 border-black dark:border-white flex items-center justify-center mb-6 transition-colors duration-300">
            <svg
              className="w-12 h-12 text-black dark:text-white transition-colors duration-300"
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

          <h1 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-4 transition-colors duration-300">
            Payment Successful! 🎉
          </h1>
          <p className="text-lg text-black/70 dark:text-white/70 mb-2 transition-colors duration-300">
            Thank you for your purchase. A confirmation email has been sent to your inbox.
          </p>
          <p className="text-sm text-black/50 dark:text-white/50 transition-colors duration-300">
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
              className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-semibold border-2 border-black dark:border-white hover:bg-white hover:dark:bg-black hover:text-black hover:dark:text-white transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {isLoading ? "Generating link..." : "📥 Download Your Ebook"}
            </button>

            {error && (
              <p className="text-black dark:text-white text-sm bg-white dark:bg-zinc-800 border-2 border-black dark:border-white p-3 transition-colors duration-300">
                {error}
              </p>
            )}
          </div>
        ) : (
          <div className="p-4 bg-white dark:bg-zinc-800 border-2 border-black dark:border-white transition-colors duration-300">
            <p className="text-black dark:text-white text-sm transition-colors duration-300">
              Missing session ID. If you completed a purchase, please check your
              email for the download link.
            </p>
          </div>
        )}

        {/* Back to store */}
        <div className="mt-10 pt-8 border-t-3 border-black dark:border-white transition-colors duration-300">
          <Link
            href="/store"
            className="text-black dark:text-white hover:underline text-sm transition-colors duration-300"
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
        <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center transition-colors duration-300">
          <div className="text-black dark:text-white transition-colors duration-300">Loading...</div>
        </div>
      }
    >
      <SuccessPageContent />
    </Suspense>
  );
}
