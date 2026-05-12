/**
 * Логика балансов и транзакций.
 *
 * Режимы работы:
 *  1. Demo       — нет адреса: все данные мок
 *  2. Read-only  — есть адрес (env WALLET_ADDRESS или query-param ?address=):
 *                  ETH + USDC со всех EVM testnet-чейнов в реальном времени
 *  3. Live       — есть EVM_PRIVATE_KEY: реальные USDC-переводы на Arc Testnet
 *
 * Arc Testnet:
 *   RPC:          https://rpc.testnet.arc.network
 *   Chain ID:     5042002
 *   USDC (ERC20): 0x3600000000000000000000000000000000000000 (6 decimals)
 *   Explorer:     https://testnet.arcscan.app
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  formatUnits,
  parseUnits,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type {
  BalancesResponse,
  ChainBalance,
  TokenBalance,
  ConsolidateRequest,
  ConsolidateResponse,
  Transaction,
} from "./types";
import {
  MOCK_BALANCES,
  MOCK_TRANSACTIONS,
  generateMockConsolidationTxs,
} from "./mock-data";
import { TESTNET_CHAINS } from "./chains";

// ── ABIs ──────────────────────────────────────────────────────────────────────

const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
] as const;

// ── Arc testnet chain definition ──────────────────────────────────────────────

const ARC_CHAIN = {
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
} as const;

const ARC_USDC = "0x3600000000000000000000000000000000000000";
const ARC_EXPLORER = "https://testnet.arcscan.app";

// ── Native token symbol per chain ─────────────────────────────────────────────

const NATIVE_SYMBOL: Record<string, string> = {
  Ethereum_Sepolia: "ETH",
  Base_Sepolia: "ETH",
  Arbitrum_Sepolia: "ETH",
  OP_Sepolia: "ETH",
  Unichain_Sepolia: "ETH",
  Polygon_PoS_Amoy: "POL",
  Avalanche_Fuji: "AVAX",
  Arc_Testnet: "USDC",
};

// ── Read live balances for one EVM chain ──────────────────────────────────────

async function readChainBalances(
  chainId: string,
  rpcUrl: string,
  viemChainId: number,
  usdcAddress: string,
  walletAddress: string
): Promise<{ nativeBalance: string; usdcBalance: string }> {
  const viemChain = {
    id: viemChainId,
    name: chainId,
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] } },
  } as const;

  const client = createPublicClient({
    chain: viemChain,
    transport: http(rpcUrl, { timeout: 8000 }),
  });

  let nativeBalance = "0.0000";
  let usdcBalance = "0.0000";

  try {
    const rawNative = await client.getBalance({
      address: walletAddress as `0x${string}`,
    });
    const nativeDecimals = chainId === "Arc_Testnet" ? 6 : 18;
    nativeBalance = parseFloat(formatUnits(rawNative, nativeDecimals)).toFixed(4);
  } catch {
    // RPC unavailable
  }

  try {
    const rawUsdc = await client.readContract({
      address: usdcAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [walletAddress as `0x${string}`],
    });
    usdcBalance = parseFloat(formatUnits(rawUsdc, 6)).toFixed(4);
  } catch {
    // Contract unavailable
  }

  return { nativeBalance, usdcBalance };
}

// ── Build tokens array for a chain ───────────────────────────────────────────

function buildTokens(
  chainId: string,
  nativeBalance: string,
  usdcBalance: string,
  usdcAddress: string
): TokenBalance[] {
  // On Arc the native token IS USDC — show once
  if (chainId === "Arc_Testnet") {
    return [
      { symbol: "USDC", balance: nativeBalance, decimals: 6, contractAddress: usdcAddress },
    ];
  }
  return [
    { symbol: NATIVE_SYMBOL[chainId] ?? "ETH", balance: nativeBalance, decimals: 18 },
    { symbol: "USDC", balance: usdcBalance, decimals: 6, contractAddress: usdcAddress },
  ];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function isConfigured(): boolean {
  return !!process.env.WALLET_ADDRESS;
}

export function hasSigningCapability(): boolean {
  return !!(process.env.EVM_PRIVATE_KEY && process.env.VAULT_ADDRESS);
}

function arcPublicClient() {
  return createPublicClient({
    chain: ARC_CHAIN,
    transport: http("https://rpc.testnet.arc.network", { timeout: 10000 }),
  });
}

// ── Balances ──────────────────────────────────────────────────────────────────

/**
 * Fetch multi-token balances for a given wallet address.
 * @param address - connected wallet (from query-param); falls back to WALLET_ADDRESS env;
 *                  returns mock data if neither is set.
 */
export async function fetchBalances(address?: string): Promise<BalancesResponse> {
  const walletAddress = address || process.env.WALLET_ADDRESS;

  if (!walletAddress) {
    return { ...MOCK_BALANCES, fetchedAt: new Date().toISOString() };
  }

  // All EVM chains with RPC + USDC address configured (skip Solana)
  const evmChains = TESTNET_CHAINS.filter(
    (c) => c.chainId && c.rpcUrl && c.usdcAddress && c.id !== "Solana_Devnet"
  );

  // Fetch all chains in parallel
  const results = await Promise.allSettled(
    evmChains.map((chain) =>
      readChainBalances(
        chain.id,
        chain.rpcUrl!,
        chain.chainId!,
        chain.usdcAddress!,
        walletAddress
      )
    )
  );

  // Build ChainBalance[] for all configured testnet chains
  const chains: ChainBalance[] = TESTNET_CHAINS.map((chain) => {
    // Non-EVM chain (Solana) — return mock with real address
    if (!chain.chainId || !chain.rpcUrl || !chain.usdcAddress) {
      const mockChain = MOCK_BALANCES.chains.find((c) => c.chainId === chain.id);
      return {
        ...(mockChain ?? {
          chainId: chain.id,
          chainName: chain.name,
          confirmedBalance: "0.0000",
          pendingBalance: "0.00",
        }),
        depositorAddress: walletAddress,
      };
    }

    const idx = evmChains.findIndex((c) => c.id === chain.id);
    const result = results[idx];

    if (!result || result.status === "rejected") {
      return {
        chainId: chain.id,
        chainName: chain.name,
        confirmedBalance: "0.0000",
        pendingBalance: "0.00",
        depositorAddress: walletAddress,
        isLive: true,
        tokens: buildTokens(chain.id, "0.0000", "0.0000", chain.usdcAddress!),
      };
    }

    const { nativeBalance, usdcBalance } = result.value;
    const tokens = buildTokens(chain.id, nativeBalance, usdcBalance, chain.usdcAddress!);

    return {
      chainId: chain.id,
      chainName: chain.name,
      confirmedBalance: usdcBalance,
      pendingBalance: "0.00",
      depositorAddress: walletAddress,
      isLive: true,
      tokens,
    };
  });

  const totalConfirmed = chains
    .reduce((sum, c) => sum + parseFloat(c.confirmedBalance || "0"), 0)
    .toFixed(4);

  return {
    isDemo: false,
    networkType: "testnet",
    token: "USDC",
    totalConfirmed,
    totalPending: "0.00",
    chains,
    walletAddress,
    fetchedAt: new Date().toISOString(),
  };
}

// ── Consolidate ───────────────────────────────────────────────────────────────

export async function consolidate(
  req: ConsolidateRequest
): Promise<ConsolidateResponse> {
  const privateKey = process.env.EVM_PRIVATE_KEY;

  // Use connected wallet address as recipient; fall back to VAULT_ADDRESS
  const recipient =
    req.recipientAddress &&
    req.recipientAddress !== "0x0000000000000000000000000000000000000001"
      ? req.recipientAddress
      : process.env.VAULT_ADDRESS;

  // ── Demo mode ───────────────────────────────────────────────────────────────
  if (!privateKey || !recipient) {
    await sleep(2000);
    const txs = generateMockConsolidationTxs(
      req.sourceChains,
      req.targetChainId,
      req.amount
    );
    return { success: true, transactions: txs };
  }

  // ── Live mode — real USDC transfer on Arc Testnet ───────────────────────────
  try {
    const account = privateKeyToAccount(privateKey as `0x${string}`);

    const walletClient = createWalletClient({
      account,
      chain: ARC_CHAIN,
      transport: http("https://rpc.testnet.arc.network", { timeout: 30000 }),
    });

    const client = arcPublicClient();
    const rawBalance = await client.readContract({
      address: ARC_USDC as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [account.address],
    });
    const currentBalance = formatUnits(rawBalance, 6);
    const requestedAmount = parseFloat(req.amount);
    const availableAmount = parseFloat(currentBalance);

    if (availableAmount < requestedAmount) {
      return {
        success: false,
        transactions: [],
        error: `Недостаточно USDC на Arc Testnet: доступно ${currentBalance}, запрошено ${req.amount}`,
      };
    }

    const amountUnits = parseUnits(req.amount, 6);

    const txHash = await walletClient.writeContract({
      address: ARC_USDC as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [recipient as `0x${string}`, amountUnits],
    });

    const tx: Transaction = {
      id: txHash,
      type: "consolidate",
      chainId: "Arc_Testnet",
      targetChainId: "Arc_Testnet",
      amount: req.amount,
      token: "USDC",
      txHash,
      explorerUrl: `${ARC_EXPLORER}/tx/${txHash}`,
      status: "confirmed",
      timestamp: new Date().toISOString(),
    };

    console.log(`[appkit] Consolidation to ${recipient}: ${txHash}`);
    return { success: true, transactions: [tx] };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown transaction error";
    console.error("[appkit] Consolidation failed:", message);
    return { success: false, transactions: [], error: message };
  }
}

// ── Transaction history ───────────────────────────────────────────────────────

export async function fetchTransactions(): Promise<Transaction[]> {
  return MOCK_TRANSACTIONS;
}

// ── Utils ─────────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
