import { NextRequest, NextResponse } from "next/server";
import { getWalletData, getMockWalletData } from "@/lib/helius";
import { scoreRisk } from "@/lib/risk-scorer";
import { isValidSolanaAddress } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { address, mode } = body as {
    address: string;
    mode: "analyze" | "recipient";
  };

  // Validate input
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

  // Demo mode — no Helius API key
  if (!process.env.HELIUS_API_KEY) {
    const mockData = getMockWalletData(address);
    const result = scoreRisk(mockData, resolvedMode);

    // Prepend a demo note to findings
    const demoFindings = [
      "⚠ Demo mode — connect a Helius API key for real on-chain data",
      ...result.findings,
    ];

    return NextResponse.json({ ...result, findings: demoFindings });
  }

  try {
    const walletData = await getWalletData(address);
    const result = scoreRisk(walletData, resolvedMode);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Helius API error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch wallet data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
