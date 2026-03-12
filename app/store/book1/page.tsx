"use client";

import { useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const BOOK = {
  title: "Chain Salad — The Ebook",
  subtitle: "A Guide to Modern Development",
  price: 499,
  priceDisplay: "₹499",
  coverImage: "/book-cover.png",
  description: `Chain Salad is a comprehensive guide to modern development practices. Whether you're a beginner looking to level up or an experienced developer wanting to stay current, this ebook covers everything you need to know.

Inside you'll find:
• Modern project architecture and design patterns
• Full-stack development workflows
• Payment integration strategies
• Cloud deployment and infrastructure
• Security best practices
• And much more...

Written in a clear, practical style with real-world examples and battle-tested approaches.`,
  pages: "250+",
  format: "PDF",
  lastUpdated: "March 2026",
};

function BookPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBuyNow = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
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
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Book Cover */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative group">
              <div className="relative aspect-[3/4] w-full max-w-sm overflow-hidden border-3 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
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
            <h1 className="text-3xl md:text-4xl font-bold text-black mb-3">
              {BOOK.title}
            </h1>
            <p className="text-lg text-black/70 mb-6">{BOOK.subtitle}</p>

            {/* Meta */}
            <div className="flex flex-wrap gap-4 mb-8">
              <span className="px-3 py-1.5 bg-white border-2 border-black text-sm text-black">
                📄 {BOOK.pages} pages
              </span>
              <span className="px-3 py-1.5 bg-white border-2 border-black text-sm text-black">
                📁 {BOOK.format}
              </span>
              <span className="px-3 py-1.5 bg-white border-2 border-black text-sm text-black">
                🔄 Updated {BOOK.lastUpdated}
              </span>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-black mb-3">
                About this book
              </h2>
              <div className="text-black/70 leading-relaxed whitespace-pre-line">
                {BOOK.description}
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-4xl font-bold text-black">
                {BOOK.priceDisplay}
              </span>
              <span className="text-lg text-black/40 line-through">₹999</span>
              <span className="px-2 py-0.5 bg-black text-white text-sm font-medium">
                50% OFF
              </span>
            </div>

            {/* Action Area */}
            {sessionId ? (
              /* If user has a session_id, they've purchased — show download button */
              <div className="space-y-4">
                <div className="p-4 bg-white border-2 border-black">
                  <p className="text-black text-sm font-medium">
                    ✅ You&apos;ve purchased this book!
                  </p>
                </div>
                <button
                  onClick={handleDownload}
                  disabled={isLoading}
                  className="w-full py-4 bg-black text-white font-semibold border-2 border-black hover:bg-white hover:text-black transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Generating link..." : "Generate Download Link"}
                </button>
              </div>
            ) : (
              /* New purchase flow */
              <div className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-5 py-4 bg-white border-2 border-black text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/20"
                />
                <button
                  onClick={handleBuyNow}
                  disabled={isLoading}
                  className="w-full py-4 bg-black text-white font-semibold border-2 border-black hover:bg-white hover:text-black transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Redirecting to Stripe..." : `Buy Now — ${BOOK.priceDisplay}`}
                </button>
              </div>
            )}

            {error && (
              <p className="mt-4 text-black text-sm bg-white border-2 border-black p-3">
                {error}
              </p>
            )}

            {/* Guarantee */}
            <p className="mt-6 text-sm text-black/50 text-center">
              🔒 Secure payment via Stripe. Instant download after purchase.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Book1Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-black">Loading...</div>
        </div>
      }
    >
      <BookPageContent />
    </Suspense>
  );
}
