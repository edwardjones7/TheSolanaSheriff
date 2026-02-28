import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-stone-700/50 bg-stone-900 py-10 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          {/* Brand */}
          <div className="flex items-center gap-2 text-amber-400">
            <ShieldCheck className="h-5 w-5" strokeWidth={2} />
            <span className="font-bold text-lg">The Solana Sheriff</span>
          </div>

          {/* Tagline */}
          <p className="text-stone-400 text-sm max-w-md">
            Protecting crypto newcomers from scams, fraud, and costly mistakes
            on Solana. Not financial advice — always do your own research.
          </p>

          {/* Links */}
          <div className="flex gap-6 text-sm text-stone-500">
            <Link href="/chat" className="hover:text-amber-400 transition-colors">
              Ask Sheriff
            </Link>
            <Link href="/analyze" className="hover:text-amber-400 transition-colors">
              Analyze
            </Link>
            <Link href="/check" className="hover:text-amber-400 transition-colors">
              Check
            </Link>
            <Link href="/resources" className="hover:text-amber-400 transition-colors">
              Resources
            </Link>
          </div>

          <p className="text-stone-600 text-xs">
            © {new Date().getFullYear()} The Solana Sheriff. For educational purposes only.
          </p>
        </div>
      </div>
    </footer>
  );
}
