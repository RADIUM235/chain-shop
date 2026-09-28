import { ChainBackground } from "@/components/ChainBackground";
import { SocialLinks } from "@/components/SocialLinks";

export default function Home() {
  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      {/* Hero Section */}
      <section className="flex-1 flex relative overflow-hidden bg-white dark:bg-black transition-colors duration-300">
        <ChainBackground />

        {/* Three rows, so the name sits in the dead middle of the screen with
            the label above it and the rest below. The rows of scales behind the
            pieces marked data-chain-text turn to fire, dimmed toward the middle. */}
        <div className="relative z-10 grid h-full w-full grid-rows-[1fr_auto_1fr] justify-items-center px-6 text-center text-white">
          <p
            data-chain-text
            className="self-end pb-8 text-sm md:text-base font-bold uppercase tracking-[0.3em] [text-shadow:0_2px_3px_#000,0_0_12px_#000]"
          >
            Coming Soon
          </p>
          {/* The name stacked, each word sized so both are the same width */}
          <h1 data-chain-text>
            <span className="sr-only">Chain Salad</span>
            <svg
              aria-hidden="true"
              viewBox="-346 0 1692 484.7"
              className="mx-auto w-[min(80vw,680px)] fill-white [filter:drop-shadow(0_5px_3px_#000)_drop-shadow(0_0_24px_rgba(0,0,0,0.9))] font-[family-name:var(--font-inter)] font-black"
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
          <div data-chain-text className="self-start pt-8">
            {/* Kept well above the size of a chain link, with a dark halo, so
                the pattern never breaks up the letters */}
            <p className="text-lg md:text-2xl font-bold tracking-tight [text-shadow:0_2px_3px_#000,0_0_12px_#000]">
              We are still linking our chains together
            </p>
            <SocialLinks className="mt-8" />
          </div>
        </div>
      </section>
    </div>
  );
}
