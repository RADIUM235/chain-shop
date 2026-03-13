"use client";

import { useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { useParams } from "next/navigation";
import { getBookById } from "@/lib/books";

function BookPageContent() {
  const searchParams = useSearchParams();
  const params = useParams<{ bookId: string }>();
  const sessionId = searchParams.get("session_id");

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load book dynamically based on route param
  const BOOK = getBookById(params.bookId || "");

  if (!BOOK) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center transition-colors duration-300">
        <div className="text-black dark:text-white text-xl font-bold transition-colors duration-300">Book not found.</div>
      </div>
    );
  }

  const handleBuyNow = async () => {
    if (!name || !email) {
      setError("Please enter both your name and email address");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      /*
      // STRIPE CHECKOUT: commented out for now
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
      */

      // PAYPAL CHECKOUT:
      const response = await fetch("/api/create-paypal-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, bookId: BOOK.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create PayPal order");
      }

      // Redirect to PayPal Approval URL
      window.location.href = data.url;

    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

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
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Book Cover */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative group">
              <div className="relative aspect-[3/4] w-full max-w-sm overflow-hidden border-3 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] transition-all duration-300">
                <Image
                  src={BOOK.coverImage}
                  alt={BOOK.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Book Details */}
          <div className="flex flex-col justify-center">
            <h1 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-3 transition-colors duration-300">
              {BOOK.title}
            </h1>
            <p className="text-lg text-black/70 dark:text-white/70 mb-6 transition-colors duration-300">{BOOK.subtitle}</p>

            {/* Meta */}
            <div className="flex flex-wrap gap-4 mb-8">
              <span className="px-3 py-1.5 bg-white dark:bg-black border-2 border-black dark:border-white text-sm text-black dark:text-white transition-colors duration-300">
                📄 {BOOK.pages} pages
              </span>
              <span className="px-3 py-1.5 bg-white dark:bg-black border-2 border-black dark:border-white text-sm text-black dark:text-white transition-colors duration-300">
                📁 {BOOK.format}
              </span>
              <span className="px-3 py-1.5 bg-white dark:bg-black border-2 border-black dark:border-white text-sm text-black dark:text-white transition-colors duration-300">
                🔄 Updated {BOOK.lastUpdated}
              </span>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-black dark:text-white mb-3 transition-colors duration-300">
                About this book
              </h2>
              <div className="text-black/70 dark:text-white/70 leading-relaxed whitespace-pre-line transition-colors duration-300">
                {BOOK.description}
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-4xl font-bold text-black dark:text-white transition-colors duration-300">
                {BOOK.priceDisplay}
              </span>
              <span className="text-lg text-black/40 dark:text-white/40 line-through transition-colors duration-300">₹999</span>
              <span className="px-2 py-0.5 bg-black dark:bg-white text-white dark:text-black text-sm font-medium transition-colors duration-300">
                50% OFF
              </span>
            </div>

            {/* Action Area */}
            {sessionId ? (
              /* If user has a session_id, they've purchased — show download button */
              <div className="space-y-4">
                <div className="p-4 bg-white dark:bg-black border-2 border-black dark:border-white transition-colors duration-300">
                  <p className="text-black dark:text-white text-sm font-medium transition-colors duration-300">
                    ✅ You&apos;ve purchased this book!
                  </p>
                </div>
                <button
                  onClick={handleDownload}
                  disabled={isLoading}
                  className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-semibold border-2 border-black dark:border-white hover:bg-white hover:dark:bg-black hover:text-black hover:dark:text-white transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Generating link..." : "Generate Download Link"}
                </button>
              </div>
            ) : (
              /* New purchase flow */
              <div className="space-y-4">
                <button
                  onClick={() => setIsModalOpen(true)}
                  disabled={isLoading}
                  className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-semibold border-2 border-black dark:border-white hover:bg-white hover:dark:bg-black hover:text-black hover:dark:text-white transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Buy Now — {BOOK.priceDisplay}
                </button>
              </div>
            )}

            {error && (
              <p className="mt-4 text-black dark:text-white text-sm bg-white dark:bg-zinc-800 border-2 border-black dark:border-white p-3 transition-colors duration-300">
                {error}
              </p>
            )}

            {/* Guarantee */}
            <p className="mt-6 text-sm text-black/50 dark:text-white/50 text-center transition-colors duration-300">
              🔒 Secure payment via PayPal. Instant download after purchase.
            </p>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 transition-colors duration-300">
          <div className="w-full max-w-md bg-white dark:bg-black border-4 border-black dark:border-white p-6 relative transition-colors duration-300">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-black dark:text-white hover:opacity-70 transition-colors duration-300"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <h3 className="text-2xl font-bold text-black dark:text-white mb-6 transition-colors duration-300">Complete Purchase</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1 transition-colors duration-300">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 bg-white dark:bg-black border-2 border-black dark:border-white text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 transition-colors duration-300"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-1 transition-colors duration-300">Email (for delivery)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 bg-white dark:bg-black border-2 border-black dark:border-white text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 transition-colors duration-300"
                />
              </div>

              <button
                onClick={handleBuyNow}
                disabled={isLoading}
                className="w-full mt-2 py-4 bg-black dark:bg-white text-white dark:text-black font-bold border-2 border-black dark:border-white hover:bg-white hover:dark:bg-black hover:text-black hover:dark:text-white transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Processing..." : `Proceed to PayPal`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center transition-colors duration-300">
          <div className="text-black dark:text-white transition-colors duration-300">Loading...</div>
        </div>
      }
    >
      <BookPageContent />
    </Suspense>
  );
}
