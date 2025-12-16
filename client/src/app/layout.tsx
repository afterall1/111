import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import StarField from "@/components/Background/StarField";

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
      <body className="bg-void text-white antialiased" suppressHydrationWarning>
        <QueryProvider>
          <div className="relative min-h-screen">
            {/* The Void: WebGL Background */}
            <StarField />

            {/* Content Layer */}
            <main className="relative z-10">
              {children}
            </main>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
