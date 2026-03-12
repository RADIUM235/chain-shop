"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center relative overflow-hidden bg-white">
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-black text-black text-sm mb-8">
            <span className="w-2 h-2 bg-black" />
            Coming Soon
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-black mb-6 tracking-tight">
            Chain{" "}
            <span className="text-black">
              Salad
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-black/70 mb-10 leading-relaxed">
            Something exciting is cooking. Stay tuned for a fresh take on modern
            development.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/store"
              className="px-8 py-4 bg-black text-white font-semibold border-2 border-black hover:bg-white hover:text-black transition-colors duration-300"
            >
              Visit Store →
            </Link>
            <button
              disabled
              className="px-8 py-4 border-2 border-black text-black/50 font-semibold cursor-not-allowed"
            >
              Notify Me (Soon)
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
