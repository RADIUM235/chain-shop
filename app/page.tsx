import { ChainBackground } from "@/components/ChainBackground";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center relative overflow-hidden bg-white dark:bg-black transition-colors duration-300">
        <ChainBackground />

        {/* The fire rows of scales cover this whole block */}
        <div data-chain-text className="relative z-10 text-center px-6 max-w-4xl mx-auto py-24 text-white">
          {/* The name stacked, each word sized so both are the same width */}
          <h1>
            <span className="sr-only">Chain Salad</span>
            <svg
              aria-hidden="true"
              viewBox="-346 0 1692 484.7"
              className="mx-auto w-[min(92vw,880px)] fill-white font-[family-name:var(--font-inter)] font-black"
            >
              <text x="-9.5" y="228.2" fontSize="304.3">CHAIN</text>
              <text x="-4.5" y="484.7" fontSize="288.6">SALAD</text>
              {/* Three dashes each side, level with the gap between the words */}
              <rect x="-346" y="234.2" width="80" height="28" />
              <rect x="-238" y="234.2" width="80" height="28" />
              <rect x="-130" y="234.2" width="80" height="28" />
              <rect x="1050" y="234.2" width="80" height="28" />
              <rect x="1158" y="234.2" width="80" height="28" />
              <rect x="1266" y="234.2" width="80" height="28" />
            </svg>
          </h1>
          {/* Kept well above the size of a chain link, with a dark halo, so the
              pattern never breaks up the letters */}
          <p className="mt-8 text-lg md:text-2xl font-bold tracking-tight [text-shadow:0_0_4px_#000,0_0_12px_#000]">
            We are still linking our chains together
          </p>
        </div>
      </section>
    </div>
  );
}
