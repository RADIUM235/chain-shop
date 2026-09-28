import { ChainBackground } from "@/components/ChainBackground";

export default function Home() {
  // Pull the hero up under the logo so the chains reach the top of the window
  return (
    <div className="-mt-16 min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center relative overflow-hidden bg-white dark:bg-black transition-colors duration-300">
        <ChainBackground />

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto py-24">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-black border-2 border-black dark:border-white text-black dark:text-white text-sm mb-8 transition-colors duration-300">
            <span className="w-2 h-2 bg-black dark:bg-white transition-colors duration-300" />
            Coming Soon
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-black dark:text-white tracking-tight leading-[1.05] transition-colors duration-300">
            We are still linking our chains together
          </h1>
        </div>
      </section>
    </div>
  );
}
