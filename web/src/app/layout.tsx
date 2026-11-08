import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { WatchLaterProvider } from "@/context/WatchLaterContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const oughter = localFont({
  src: "../../public/fonts/Oughter.otf",
  variable: "--font-oughter",
  display: "swap"
});
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Watch Later — Never lose a reel worth revisiting.",
  description: "Curate, classify, and revisit your saved reels and social content in high-fidelity.",
  icons: {
    icon: "/logo.png"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${oughter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased bg-[#0B0B0B] bg-fabric text-[#D9D9D9] selection:bg-[#333333] selection:text-white">
        <WatchLaterProvider>
          {children}
        </WatchLaterProvider>
      </body>
    </html>
  );
}
