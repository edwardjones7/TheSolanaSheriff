import { WalletData } from "@/types";

export async function getWalletData(address: string): Promise<WalletData> {
  const apiKey = process.env.HELIUS_API_KEY;

  if (!apiKey) {
    throw new Error("HELIUS_API_KEY not configured");
  }

  const baseUrl = `https://api.helius.xyz/v0`;

  // Get transaction history (up to 100 transactions)
  const txResponse = await fetch(
    `${baseUrl}/addresses/${address}/transactions?api-key=${apiKey}&limit=100`,
    { next: { revalidate: 60 } }
  );

  if (!txResponse.ok) {
    const text = await txResponse.text();
    throw new Error(`Helius API error: ${txResponse.status} — ${text}`);
  }

  const transactions: Record<string, unknown>[] = await txResponse.json();

  // Get token/NFT holdings via DAS API
  const assetResponse = await fetch(
    `https://mainnet.helius-rpc.com/?api-key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "getAssets",
        method: "getAssetsByOwner",
        params: {
          ownerAddress: address,
          page: 1,
          limit: 1000,
        },
      }),
    }
  );

  let assets: Record<string, unknown>[] = [];
  if (assetResponse.ok) {
    const assetData = await assetResponse.json();
    assets = assetData.result?.items ?? [];
  }

  // Compute wallet age from first transaction timestamp
  const sortedTxs = [...transactions].sort((a, b) => {
    const aTime = typeof a.timestamp === "number" ? a.timestamp : 0;
    const bTime = typeof b.timestamp === "number" ? b.timestamp : 0;
    return aTime - bTime;
  });

  const firstTimestamp =
    typeof sortedTxs[0]?.timestamp === "number"
      ? (sortedTxs[0].timestamp as number)
      : Date.now() / 1000;

  const ageInDays = (Date.now() / 1000 - firstTimestamp) / 86400;

  // Count unique outbound wallets (potential drainer/scammer indicator)
  const outboundWallets = new Set<string>();
  for (const tx of transactions) {
    const nativeTransfers = tx.nativeTransfers as
      | { fromUserAccount?: string; toUserAccount?: string }[]
      | undefined;
    const tokenTransfers = tx.tokenTransfers as
      | { fromUserAccount?: string; toUserAccount?: string }[]
      | undefined;

    for (const transfer of nativeTransfers ?? []) {
      if (transfer.fromUserAccount === address && transfer.toUserAccount) {
        outboundWallets.add(transfer.toUserAccount);
      }
    }
    for (const transfer of tokenTransfers ?? []) {
      if (transfer.fromUserAccount === address && transfer.toUserAccount) {
        outboundWallets.add(transfer.toUserAccount);
      }
    }
  }

  // Count inbound token mints (airdrop detection)
  const inboundTokenMints = new Set<string>();
  for (const tx of transactions) {
    const tokenTransfers = tx.tokenTransfers as
      | { toUserAccount?: string; mint?: string }[]
      | undefined;
    for (const transfer of tokenTransfers ?? []) {
      if (transfer.toUserAccount === address && transfer.mint) {
        inboundTokenMints.add(transfer.mint);
      }
    }
  }

  return {
    transactions,
    assets,
    age: ageInDays,
    uniqueOutboundWallets: outboundWallets.size,
    inboundTokenCount: inboundTokenMints.size,
    transactionCount: transactions.length,
  };
}

export function getMockWalletData(address: string): WalletData {
  // Generate deterministic-ish mock data based on address
  const seed = address.charCodeAt(0) + address.charCodeAt(address.length - 1);
  const age = 30 + (seed % 300);
  const txCount = 10 + (seed % 90);
  const outbound = seed % 15;
  const inbound = seed % 8;

  return {
    transactions: Array(txCount).fill({}),
    assets: [],
    age,
    uniqueOutboundWallets: outbound,
    inboundTokenCount: inbound,
    transactionCount: txCount,
  };
}
