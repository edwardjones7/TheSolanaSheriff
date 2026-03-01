import { NextRequest, NextResponse } from "next/server";
import {
  getWalletData,
  getMockWalletData,
  getSolBalance,
  buildRiskEvidence,
} from "@/lib/helius";
import { scoreRisk } from "@/lib/risk-scorer";
import { assessWalletRiskWithGemini } from "@/lib/gemini";
import { isValidSolanaAddress } from "@/lib/utils";
import { AiAssessment, RiskEvidence } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function getDeterministicDemoBalance(address: string): number {
  const seed = address.charCodeAt(0) + address.charCodeAt(address.length - 1);
  return Number(((seed % 300) / 10).toFixed(4));
}

async function tryGeminiAssessment(
  evidence: RiskEvidence,
  mode: "analyze" | "recipient"
): Promise<{ ai?: AiAssessment; aiError?: string }> {
  if (!process.env.GEMINI_API_KEY) {
    return {};
  }
  try {
    const ai = await assessWalletRiskWithGemini(evidence, mode);
    return { ai };
  } catch (error) {
    console.error("Gemini wallet risk assessment failed:", error);
    return {
      aiError:
        error instanceof Error
          ? error.message
          : "AI assessment unavailable — using heuristic analysis.",
    };
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { address, mode } = body as {
    address: string;
    mode: "analyze" | "recipient";
  };

  if (!address || typeof address !== "string") {
    return NextResponse.json(
      { error: "Wallet address is required" },
      { status: 400 }
    );
  }

  if (!isValidSolanaAddress(address)) {
    return NextResponse.json(
      { error: "Invalid Solana wallet address" },
      { status: 400 }
    );
  }

  const resolvedMode = mode === "recipient" ? "recipient" : "analyze";

  if (!process.env.HELIUS_API_KEY) {
    const mockData = getMockWalletData(address);
    const result = scoreRisk(mockData, resolvedMode);
    const solBalance = getDeterministicDemoBalance(address);
    const riskEvidence = buildRiskEvidence(address, mockData);

    const { ai, aiError } = await tryGeminiAssessment(riskEvidence, resolvedMode);

    const demoFindings = [
      "⚠ Demo mode — connect a Helius API key for real on-chain data",
      ...result.findings,
    ];

    return NextResponse.json({
      ...result,
      solBalance,
      findings: demoFindings,
      riskEvidence,
      ai,
      aiError,
    });
  }

  try {
    const [walletData, solBalance] = await Promise.all([
      getWalletData(address),
      getSolBalance(address),
    ]);
    const result = scoreRisk(walletData, resolvedMode);
    const riskEvidence = buildRiskEvidence(address, walletData);

    const { ai, aiError } = await tryGeminiAssessment(riskEvidence, resolvedMode);

    return NextResponse.json({
      ...result,
      solBalance,
      riskEvidence,
      ai,
      aiError,
    });
  } catch (error) {
    console.error("Helius API error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch wallet data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
