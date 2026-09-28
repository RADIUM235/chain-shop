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

        </ThemeProvider>
      </body>
    </html>
  );
}
