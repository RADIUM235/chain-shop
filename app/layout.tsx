import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b-4 border-black">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link
              href="/"
              className="text-lg font-bold text-black hover:underline"
            >
              Chain <span className="text-black">Salad</span>
            </Link>
            <div className="flex items-center gap-6">
              <Link
                href="/store"
                className="text-sm text-black font-medium hover:underline"
              >
                Store
              </Link>
            </div>
          </div>
        </nav>

        {/* Main content with top padding for fixed nav */}
        <main className="pt-16">{children}</main>

        {/* Footer */}
        <footer className="bg-white border-t-4 border-black py-8">
          <div className="max-w-6xl mx-auto px-6 text-center text-sm text-black">
            © {new Date().getFullYear()} Chain Salad. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}
