import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono, Sofia_Sans_Extra_Condensed, Barlow } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-zolo" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const sofiaSans = Sofia_Sans_Extra_Condensed({ 
  subsets: ["latin"], 
  weight: ["200", "300", "400", "600"],
  variable: "--font-darkroom-display" 
});
const barlow = Barlow({ 
  subsets: ["latin"], 
  weight: ["300", "400", "500", "600"],
  variable: "--font-darkroom-body" 
});

export const metadata: Metadata = {
  title: "Watch Later — Never lose a reel worth revisiting.",
  description: "Curate, classify, and revisit your saved reels and social content in high-fidelity.",
  icons: {
    icon: "/logo.jpg"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${sofiaSans.variable} ${barlow.variable}`}>
      <body className="font-sans antialiased bg-[#0e0e11] text-[#ecebe8] selection:bg-[#f59e0b]/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
