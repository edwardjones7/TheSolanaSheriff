"use client";

import { useState } from "react";
import {
  Search,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import WalletInput from "@/components/WalletInput";
import RiskBadge from "@/components/RiskBadge";
import { AnalysisResult } from "@/types";
import { shortenAddress } from "@/lib/utils";

function formatSol(balance: number): string {
  return `${balance.toFixed(4)} SOL`;
}

function ConfidenceBar({ value }: { value: number }) {
  const percent = Math.round(value * 100);
  const color =
    percent >= 75
      ? "bg-green-500"
      : percent >= 50
        ? "bg-yellow-500"
        : "bg-red-500";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-stone-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs text-stone-400 tabular-nums">{percent}%</span>
    </div>
  );
}

export default function AnalyzePage() {
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analyzedAddress, setAnalyzedAddress] = useState("");
  const [error, setError] = useState("");
  const [showKeyFindings, setShowKeyFindings] = useState(false);

  const analyze = async () => {
    const trimmed = address.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError("");
    setResult(null);
    setShowKeyFindings(false);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: trimmed, mode: "analyze" }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Analysis failed");
      }

      const data: AnalysisResult = await response.json();
      setResult(data);
      setAnalyzedAddress(trimmed);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to analyze wallet. Please check the address and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const displayLevel = result?.ai?.riskLevel ?? result?.riskLevel ?? "low";

  const riskColors = {
    low: "border-green-500/20 bg-green-500/5",
    medium: "border-yellow-500/20 bg-yellow-500/5",
    high: "border-red-500/20 bg-red-500/5",
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-10 animate-fade-in-up" style={{ animationDelay: "0ms" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5">
              <Search className="h-5 w-5 text-amber-400" />
            </div>
            <h1 className="text-3xl font-bold text-stone-100">
              Wallet Analyzer
            </h1>
          </div>
          <p className="text-stone-400 leading-relaxed">
            Paste any Solana wallet address to check for scammer patterns and
            risk signals — whether you&apos;re investigating a suspicious wallet or
            verifying a recipient before sending funds.
          </p>
        </div>

        {/* Input */}
        <div
          className="bg-stone-800/60 border border-stone-700 rounded-2xl p-6 mb-6 animate-fade-in-up"
          style={{ animationDelay: "80ms" }}
        >
          <label className="block text-sm font-medium text-stone-300 mb-3">
            Solana Wallet Address
          </label>
          <WalletInput
            value={address}
            onChange={setAddress}
            onSubmit={analyze}
            isLoading={isLoading}
            buttonText="Analyze Wallet"
            placeholder="e.g. 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-sm animate-fade-in-up">
            ⚠ {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4 animate-fade-in-up">
            {/* Main assessment card */}
            <div
              className={`border rounded-2xl overflow-hidden ${riskColors[displayLevel]}`}
            >
              {/* Result header */}
              <div className="px-6 py-5 border-b border-stone-700/50 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {result.ai && (
                      <Sparkles className="h-4 w-4 text-amber-400" />
                    )}
                    <h2 className="text-lg font-bold text-stone-100">
                      {result.ai ? "AI Risk Assessment" : "Risk Assessment"}
                    </h2>
                  </div>
                  <p className="text-stone-500 text-xs font-mono">
                    {shortenAddress(analyzedAddress)}
                  </p>
                  {typeof result.solBalance === "number" && (
                    <p className="text-stone-300 text-sm mt-2">
                      SOL Balance: {formatSol(result.solBalance)}
                    </p>
                  )}
                </div>
                <RiskBadge level={displayLevel} size="lg" />
              </div>

              {/* AI assessment */}
              {result.ai && (
                <>
                  {/* AI advice (shown first) */}
                  <div className="px-6 py-5 border-b border-stone-700/50">
                    <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
                      Sheriff&apos;s AI Assessment
                    </h3>
                    <p className="text-stone-200 text-sm leading-relaxed">
                      {result.ai.advice}
                    </p>
                  </div>

                  {/* Confidence */}
                  <div className="px-6 py-4 border-b border-stone-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                        Confidence
                      </h3>
                    </div>
                    <ConfidenceBar value={result.ai.confidence} />
                  </div>

                  {/* Key Findings dropdown (collapsed by default, after AI assessment) */}
                  {result.ai.keyReasons.length > 0 && (
                    <div className="border-b border-stone-700/50">
                      <button
                        onClick={() => setShowKeyFindings(!showKeyFindings)}
                        className="w-full px-6 py-3.5 flex items-center justify-between text-stone-400 hover:text-stone-300 transition-colors"
                      >
                        <span className="text-xs font-semibold uppercase tracking-wider">
                          Key Findings
                        </span>
                        {showKeyFindings ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                      {showKeyFindings && (
                        <div className="px-6 pb-5 animate-fade-in-up">
                          <ul className="space-y-2.5">
                            {result.ai.keyReasons.map((reason, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2.5 text-stone-300 text-sm animate-fade-in-up"
                                style={{ animationDelay: `${i * 50}ms` }}
                              >
                                <ChevronRight className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Fallback when AI is unavailable — show heuristic analysis */}
              {!result.ai && (
                <>
                  {result.aiError && (
                    <div className="px-6 py-4 border-b border-stone-700/50 flex items-start gap-2.5">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <p className="text-yellow-400/80 text-sm">
                        AI assessment unavailable — showing standard analysis. ({result.aiError})
                      </p>
                    </div>
                  )}

                  <div className="px-6 py-5 border-b border-stone-700/50">
                    <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
                      Findings
                    </h3>
                    <ul className="space-y-2.5">
                      {result.findings.map((finding, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2.5 text-stone-300 text-sm animate-fade-in-up"
                          style={{ animationDelay: `${i * 50}ms` }}
                        >
                          <ChevronRight className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          {finding}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="px-6 py-5">
                    <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
                      Sheriff&apos;s Recommendation
                    </h3>
                    <p className="text-stone-200 text-sm leading-relaxed">
                      {result.advice}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Info note */}
        <p className="text-stone-600 text-xs text-center mt-6 animate-fade-in" style={{ animationDelay: "160ms" }}>
          Analysis is based on on-chain data from Helius.{" "}
          {result?.ai
            ? "AI assessment powered by Google Gemini."
            : "Risk scores are heuristic-based"}{" "}
          — always use your own judgment.
        </p>
      </div>
    </div>
  );
}
