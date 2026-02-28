import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "The Solana Sheriff",
    template: "%s | The Solana Sheriff",
  },
  description:
    "Protecting crypto newcomers from scams, fraud, and costly mistakes on Solana. Check wallets, analyze risk, and get AI-powered safety advice.",
  keywords: ["Solana", "crypto safety", "scam detector", "wallet analyzer", "Web3 security"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-stone-900 text-stone-100 min-h-screen flex flex-col antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
