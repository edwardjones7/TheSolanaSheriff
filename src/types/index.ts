export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface AnalysisResult {
  riskLevel: "low" | "medium" | "high";
  score: number;
  findings: string[];
  advice: string;
}

export interface WalletData {
  transactions: Record<string, unknown>[];
  assets: Record<string, unknown>[];
  age: number;
  uniqueOutboundWallets: number;
  inboundTokenCount: number;
  transactionCount: number;
}
