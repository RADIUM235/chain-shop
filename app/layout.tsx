import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "Chain Salad — Ebook Store",
  description:
    "Purchase and download premium ebooks on modern development practices.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased transition-colors duration-300"
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-black border-b-4 border-black dark:border-white transition-colors duration-300">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
              <Link
                href="/"
                className="text-lg font-bold text-black dark:text-white hover:underline transition-colors duration-300"
              >
                Chain <span className="text-black dark:text-white">Salad</span>
              </Link>
              <div className="flex items-center gap-6">
                <Link
                  href="/store"
                  className="text-sm text-black dark:text-white font-medium hover:underline transition-colors duration-300"
                >
                  Store
                </Link>
                <ThemeToggle />
              </div>
          </div>
        </nav>

        {/* Main content with top padding for fixed nav */}
        <main className="pt-16">{children}</main>

          {/* Footer */}
          <footer className="bg-white dark:bg-black border-t-4 border-black dark:border-white py-8 transition-colors duration-300">
            <div className="max-w-6xl mx-auto px-6 text-center text-sm text-black dark:text-white transition-colors duration-300">
              © {new Date().getFullYear()} Chain Salad. All rights reserved.
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
