import { GoogleGenerativeAI } from "@google/generative-ai";

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
