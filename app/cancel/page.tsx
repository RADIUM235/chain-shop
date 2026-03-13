import Link from "next/link";

export default function CancelPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center px-6 transition-colors duration-300">
      <div className="max-w-lg w-full text-center">
        {/* Cancel Icon */}
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
                d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-4 transition-colors duration-300">
            Payment Cancelled
          </h1>
          <p className="text-lg text-black/70 dark:text-white/70 mb-2 transition-colors duration-300">
            Your payment was not processed. No charges have been made.
          </p>
          <p className="text-sm text-black/50 dark:text-white/50 transition-colors duration-300">
            If you experienced any issues, feel free to try again or reach out
            for support.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <Link
            href="/store/book1"
            className="block w-full py-4 bg-black dark:bg-white text-white dark:text-black font-semibold border-2 border-black dark:border-white hover:bg-white hover:dark:bg-black hover:text-black hover:dark:text-white transition-colors duration-300 text-center"
          >
            Try Again
          </Link>
          <Link
            href="/store"
            className="block text-black dark:text-white hover:underline text-sm transition-colors duration-300"
          >
            ← Back to Store
          </Link>
        </div>
      </div>
    </div>
  );
}
