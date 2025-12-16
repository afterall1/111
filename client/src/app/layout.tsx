import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";

// Font Konfigürasyonu
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Chronos Index",
  description: "Advanced Crypto Momentum Screener",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="bg-[#050505] text-gray-200 antialiased selection:bg-cyan-500/30" suppressHydrationWarning>
        <QueryProvider>
          <main className="min-h-screen relative">
            {/* Arka plana hafif bir ambient ışık efekti */}
            <div className="fixed top-0 left-0 w-full h-96 bg-cyan-900/10 blur-[120px] -z-10 pointer-events-none" />
            {children}
          </main>
        </QueryProvider>
      </body>
    </html>
  );
}
