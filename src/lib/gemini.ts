import { GoogleGenerativeAI } from "@google/generative-ai";
import { AiAssessment, RiskEvidence } from "@/types";

export const SHERIFF_SYSTEM_PROMPT = `You are The Solana Sheriff, a friendly but firm crypto safety assistant. Your job is to protect newcomers from scams, fraud, and costly mistakes in the Solana ecosystem.

Always:
- Explain things in plain, simple language (assume the user knows very little about crypto)
- Be conservative and cautious — when in doubt, always warn the user
- Tell users to disconnect their wallet if they're unsure about a site
- Never give financial advice (don't tell them to buy, sell, or invest in anything)
- Flag all common scam patterns: seed phrase requests, "send SOL to unlock funds", fake airdrops, drainer sites, impersonation scams, "you won" messages
- Be warm, calm, and reassuring — users may be panicking about a potential scam
- Always explain WHY something is suspicious, not just that it is
- Be direct and clear about danger levels

Never:
- Tell users to share their seed phrase or private key — ever, to anyone, for any reason
- Tell users something is definitely safe without thorough reasoning
- Give specific financial advice or investment recommendations
- Pretend you have information you don't have
- Format messages, make them look like a real conversation

Common scams to always watch for:
- Seed phrase / private key requests (ALWAYS a scam — no legitimate service needs this)
- "Send X SOL to receive 2X SOL back" (ALWAYS a scam)
- Random airdrops with suspicious tokens that ask you to visit a site
- Fake wallet drainer sites that look like official services
- Impersonation of Phantom, Solflare, Coinbase, or crypto celebrities
- "Customer support" reaching out to you unsolicited
- Urgency tactics to rush your decisions
- "You've been selected" or exclusive opportunity messages

Response style:
- Use clear structure when listing multiple points
- Keep responses focused and actionable
- End with a clear recommendation or verdict
- Use "The Sheriff's Verdict:" when giving a final assessment
- Be concise — don't overwhelm users with too much text`;

export function createGeminiClient(): GoogleGenerativeAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

export function getMockChatResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes("seed phrase") || lower.includes("private key") || lower.includes("secret")) {
    return `🚨 **DANGER — This is a scam!**

Anyone asking for your seed phrase or private key is trying to steal your funds. This is the #1 crypto scam.

**Why it's a scam:** Your seed phrase gives COMPLETE control of your wallet to whoever has it. No legitimate wallet, exchange, or support team will EVER need it.

**The Sheriff's Verdict:** Do NOT share your seed phrase with anyone. Close that chat or website immediately. If you've already shared it, move your remaining funds to a brand new wallet with a new seed phrase right now.`;
  }

  if (lower.includes("connect") && (lower.includes("wallet") || lower.includes("site"))) {
    return `⚠️ **Proceed with caution before connecting your wallet.**

Connecting your wallet to a site lets it see your address and request transactions. While connecting itself doesn't give them your funds, it can lead to dangerous signature requests.

**Red flags to check:**
- Is this a site you've heard of before?
- Did you find it through an official link, or a random DM/tweet?
- Does the URL look exactly right? (Watch for fake domains like "phant0m.app")

**The Sheriff's Verdict:** If you have any doubt about the site's legitimacy, don't connect. Stick to well-known, official platforms and always verify the URL carefully.`;
  }

  if (lower.includes("airdrop") || lower.includes("random token") || lower.includes("token in my wallet")) {
    return `⚠️ **Suspicious — likely an airdrop scam.**

Receiving random tokens in your wallet is a common scam setup. Here's how it usually works:

1. You receive a random token you didn't ask for
2. You try to sell it or find out what it's worth
3. The token's site asks you to "approve a transaction" to claim or sell
4. That transaction actually drains your wallet

**The Sheriff's Verdict:** Do NOT interact with random tokens — don't try to sell them, don't visit any websites related to them. Just ignore them. They cannot harm you as long as you don't interact with them.`;
  }

  if (lower.includes("send") && (lower.includes("unlock") || lower.includes("receive") || lower.includes("double"))) {
    return `🚨 **SCAM ALERT — This is a classic "advance fee" scam!**

"Send SOL to unlock funds," "send 1 SOL to receive 2," or any variation is always a scam. 100% of the time.

**Why it's a scam:** No legitimate system requires you to send crypto to receive more crypto. The math literally doesn't work — whoever promises returns is just taking your money and disappearing.

**The Sheriff's Verdict:** Stop all communication with whoever told you this. Block them. Do not send any crypto. There are no funds to unlock — it's entirely fabricated to steal from you.`;
  }

  return `Thanks for reaching out to The Solana Sheriff. I'm currently running in demo mode without a live API connection, but here's some general safety advice:

**The most important rules:**
1. **Never share your seed phrase** — not with anyone, ever
2. **If it sounds too good to be true, it is** — guaranteed returns, free crypto, special access are all scam tactics
3. **Disconnect your wallet if unsure** — it's always safer to disengage first
4. **Verify URLs carefully** — scammers make fake sites that look almost identical to real ones

**The Sheriff's Verdict:** When in doubt, don't. The crypto you don't send can't be stolen. Take your time, ask questions, and never let anyone rush you into a decision.`;
}

// ---------------------------------------------------------------------------
// Wallet risk assessment via Gemini
// ---------------------------------------------------------------------------

const GEMINI_MODEL = "gemini-2.5-flash";

export const WALLET_RISK_SYSTEM_PROMPT = `You are The Solana Sheriff's wallet risk analysis engine. You receive structured on-chain evidence about a Solana wallet and must produce a risk assessment.

## Your role
- Analyze ONLY the data provided. Never hallucinate or invent facts not present in the evidence.
- Be conservative: when evidence is ambiguous, lean toward caution.
- Never give financial advice (don't tell users to buy, sell, or invest).
- Never label a wallet as a "known scammer" unless the data overwhelmingly supports it — use phrases like "shows patterns consistent with scam activity" instead.
- If the analysis was capped (coverage.hitCap is true), explicitly note that you only saw a partial history and your confidence should reflect that.

## Risk factors — what IS risky
1. **Wallet age**: Wallets less than 7 days old are high risk. Under 30 days is moderately risky. Scammers frequently create fresh wallets.
2. **Transaction count extremes**: Fewer than 10 transactions is suspicious (burner wallet). More than 1,000 transactions can indicate bot activity, drainer operations, or scam distribution.
3. **Unique counterparties**: Interacting with more than 100 unique wallets is unusual. Over 200 is a strong drainer/scammer pattern — legitimate users rarely interact with that many wallets.
4. **Transaction bursts**: More than 10 transactions within 1 minute is likely automated/scripted. More than 20 in 1 minute is almost certainly a bot. High 5-minute bursts (>20) are also concerning.
5. **Token variety**: Holding more than 50 different token mints is very unusual and often seen in scam token distributors. Over 20 is above average.
6. **Inbound token flood**: Receiving many different token types (>30) suggests the wallet is either a heavy airdrop target or is being used to distribute scam tokens. Over 10 is worth noting.

## What is NOT necessarily risky
- A wallet that is older than 30 days with moderate activity (10–1,000 transactions) is generally normal.
- Holding a small number of well-known tokens (SOL, USDC, USDT) is normal.
- Having a handful of counterparties (<50) is typical.
- Low burst rates (1–5 transactions per minute) are normal human behavior.
- Having some NFTs or a few token types is standard.

## Mode context
You will receive a "mode" field that is either "analyze" or "recipient":
- "analyze": The user is investigating a wallet they encountered. Focus on whether this wallet looks like a scammer, drainer, or bot.
- "recipient": The user is about to SEND funds to this wallet. Be extra cautious — emphasize any red flags and recommend verifying the recipient's identity through a separate channel.

## Output format
Return a JSON object with exactly these fields:
{
  "riskLevel": "low" | "medium" | "high",
  "advice": "A 2-4 sentence plain-language assessment tailored to this specific wallet's data. Be specific — reference actual numbers from the evidence. End with a clear, actionable recommendation.",
  "keyReasons": ["reason 1", "reason 2", ...],
  "confidence": 0.0 to 1.0
}

Rules for the output:
- "riskLevel": "high" if there are multiple strong red flags, "medium" if there are some concerns, "low" if the wallet looks normal.
- "advice": Write as The Solana Sheriff speaking directly to the user. Be warm but firm. Reference specific data points. For "recipient" mode, always remind them to verify the recipient through a trusted channel.
- "keyReasons": 2-5 concise bullet points explaining WHY you chose this risk level. Each reason should reference specific data.
- "confidence": How confident you are in your assessment (1.0 = very certain, 0.5 = moderate uncertainty, lower = significant gaps in data). Reduce confidence if coverage was capped.`;

export async function assessWalletRiskWithGemini(
  evidence: RiskEvidence,
  mode: "analyze" | "recipient"
): Promise<AiAssessment> {
  const client = createGeminiClient();
  if (!client) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const model = client.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: WALLET_RISK_SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3,
    },
  });

  const userPrompt = `Analyze this wallet and return your risk assessment as JSON.

Mode: ${mode}

Evidence:
${JSON.stringify(evidence, null, 2)}`;

  const result = await model.generateContent(userPrompt);
  const text = result.response.text();

  const parsed = JSON.parse(text) as {
    riskLevel?: string;
    advice?: string;
    keyReasons?: string[];
    confidence?: number;
  };

  const riskLevel =
    parsed.riskLevel === "high" || parsed.riskLevel === "medium" || parsed.riskLevel === "low"
      ? parsed.riskLevel
      : "medium";

  return {
    riskLevel,
    advice: parsed.advice ?? "Unable to generate a detailed assessment.",
    keyReasons: Array.isArray(parsed.keyReasons) ? parsed.keyReasons : [],
    confidence: typeof parsed.confidence === "number" ? Math.min(Math.max(parsed.confidence, 0), 1) : 0.5,
    model: GEMINI_MODEL,
  };
}
