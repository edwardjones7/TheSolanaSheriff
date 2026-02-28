"use client";

import { Search, Loader2 } from "lucide-react";
import { isValidSolanaAddress } from "@/lib/utils";

interface WalletInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  buttonText: string;
  placeholder?: string;
}

export default function WalletInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  buttonText,
  placeholder = "Enter a Solana wallet address...",
}: WalletInputProps) {
  const isValid = isValidSolanaAddress(value.trim());
  const showError = value.trim().length > 0 && !isValid;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isValid && !isLoading) {
      onSubmit();
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          spellCheck={false}
          className="w-full bg-stone-800 border border-stone-600 rounded-xl px-4 py-3.5 pr-12 text-stone-100 placeholder-stone-500 font-mono text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-colors"
        />
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500 pointer-events-none" />
      </div>

      {showError && (
        <p className="text-red-400 text-sm flex items-center gap-1.5">
          <span>⚠</span> Please enter a valid Solana wallet address
        </p>
      )}

      <button
        onClick={onSubmit}
        disabled={isLoading || !isValid}
        className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-700 disabled:text-stone-500 disabled:cursor-not-allowed text-stone-900 font-bold py-3.5 rounded-xl transition-colors"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          buttonText
        )}
      </button>
    </div>
  );
}
