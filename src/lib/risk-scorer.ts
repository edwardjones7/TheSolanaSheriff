import { WalletData, AnalysisResult } from "@/types";

interface ScoringFinding {
  text: string;
  points: number;
}

export function scoreRisk(
  data: WalletData,
  mode: "analyze" | "recipient"
): AnalysisResult {
  let score = 0;
  const scoredFindings: ScoringFinding[] = [];

  // --- Heuristic: Wallet age ---
  if (data.age < 7) {
    score += 2;
    scoredFindings.push({
      text: `Very new wallet — created only ${Math.round(data.age)} day(s) ago`,
      points: 2,
    });
  } else if (data.age < 30) {
    score += 1;
    scoredFindings.push({
      text: `Relatively new wallet — ${Math.round(data.age)} days old`,
      points: 1,
    });
  } else {
    scoredFindings.push({
      text: `Established wallet — ${Math.round(data.age)} days old`,
      points: 0,
    });
  }

  // --- Heuristic: Transaction count ---
  if (data.transactionCount < 5) {
    scoredFindings.push({
      text: `Very few transactions (${data.transactionCount}) — limited history to assess`,
      points: 0,
    });
  } else if (data.transactionCount > 500) {
    scoredFindings.push({
      text: `High transaction volume (${data.transactionCount} transactions) — active wallet`,
      points: 0,
    });
  }

  // --- Heuristic: Unique outbound wallets (drainer/scammer pattern) ---
  if (data.uniqueOutboundWallets > 100) {
    score += 3;
    scoredFindings.push({
      text: `Sent funds to ${data.uniqueOutboundWallets} unique addresses — strong drainer/scammer pattern`,
      points: 3,
    });
  } else if (data.uniqueOutboundWallets > 50) {
    score += 2;
    scoredFindings.push({
      text: `Sent funds to ${data.uniqueOutboundWallets} unique addresses — unusual outbound activity`,
      points: 2,
    });
  } else if (data.uniqueOutboundWallets > 20) {
    score += 1;
    scoredFindings.push({
      text: `Sent funds to ${data.uniqueOutboundWallets} unique addresses — somewhat high`,
      points: 1,
    });
  }

  // --- Heuristic: Inbound unknown tokens (airdrop scam pattern) ---
  if (data.inboundTokenCount > 30) {
    score += 2;
    scoredFindings.push({
      text: `Received ${data.inboundTokenCount} different token types — heavy airdrop target or distributor`,
      points: 2,
    });
  } else if (data.inboundTokenCount > 10) {
    score += 1;
    scoredFindings.push({
      text: `Received ${data.inboundTokenCount} different token types — possible airdrop activity`,
      points: 1,
    });
  }

  // --- Determine risk level ---
  let riskLevel: "low" | "medium" | "high";
  if (score >= 6) {
    riskLevel = "high";
  } else if (score >= 3) {
    riskLevel = "medium";
  } else {
    riskLevel = "low";
  }

  // --- Generate findings list (most significant first) ---
  const findings = scoredFindings
    .sort((a, b) => b.points - a.points)
    .map((f) => f.text);

  if (findings.length === 0) {
    findings.push("No significant risk indicators detected");
  }

  // --- Generate contextual advice ---
  let advice: string;

  if (mode === "recipient") {
    if (riskLevel === "high") {
      advice =
        "Do NOT send funds to this wallet. Multiple high-risk indicators suggest this could be a scammer or drainer. Verify the recipient through a different channel before proceeding.";
    } else if (riskLevel === "medium") {
      advice =
        "Proceed with caution. Some suspicious patterns detected — verify you know this recipient personally and start with a small test amount if you must send.";
    } else {
      advice =
        "This wallet appears to have normal activity patterns. Still, always confirm the recipient's address through a trusted channel before sending large amounts.";
    }
  } else {
    if (riskLevel === "high") {
      advice =
        "This wallet shows multiple high-risk indicators. Avoid interacting with it, sending funds to it, or clicking any links it has promoted.";
    } else if (riskLevel === "medium") {
      advice =
        "This wallet shows some suspicious patterns. Exercise caution and avoid sending significant funds until you have verified the owner's identity.";
    } else {
      advice =
        "This wallet appears to have normal, healthy activity patterns. No major red flags detected, but always stay vigilant in crypto.";
    }
  }

  return { riskLevel, score, findings, advice };
}
