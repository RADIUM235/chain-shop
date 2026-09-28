import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

// Heavy weight for the studio name
const inter = Inter({
  subsets: ["latin"],
  weight: "900",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Chain Salad",
  description:
    "Purchase and download premium ebooks on modern development practices.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} ${inter.variable}`} suppressHydrationWarning>
      <body
        className={`${jetbrainsMono.className} antialiased transition-colors duration-300`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          // No toggle anymore: new key so choices saved by the old toggle are ignored
          storageKey="theme-system"
          disableTransitionOnChange
        >
        <main>{children}</main>

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
