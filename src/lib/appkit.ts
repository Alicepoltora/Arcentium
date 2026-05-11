/**
 * Логика балансов и транзакций.
 *
 * Режимы работы:
 *  1. Demo       — нет WALLET_ADDRESS: все данные мок
 *  2. Read-only  — есть WALLET_ADDRESS, нет EVM_PRIVATE_KEY:
 *                  Arc Testnet = реальный баланс, остальное мок
 *  3. Live       — есть WALLET_ADDRESS + EVM_PRIVATE_KEY:
 *                  Arc Testnet = реальный баланс + реальные транзакции
 *
 * Arc Testnet:
 *   RPC:          https://rpc.testnet.arc.network
 *   Chain ID:     5042002
 *   USDC:         0x3600000000000000000000000000000000000000 (6 decimals)
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

// ── ABI ──────────────────────────────────────────────────────────────────────

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

// ── Arc testnet chain definition ─────────────────────────────────────────────

const ARC_CHAIN = {
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
} as const;

const ARC_USDC = "0x3600000000000000000000000000000000000000";
const ARC_EXPLORER = "https://testnet.arcscan.app";

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

export async function fetchBalances(): Promise<BalancesResponse> {
  const walletAddress = process.env.WALLET_ADDRESS;

  if (!walletAddress) {
    return { ...MOCK_BALANCES, fetchedAt: new Date().toISOString() };
  }

  // Read real Arc Testnet USDC balance
  let arcBalance = "0.00";
  try {
    const client = arcPublicClient();
    const raw = await client.readContract({
      address: ARC_USDC as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [walletAddress as `0x${string}`],
    });
    arcBalance = formatUnits(raw, 6);
  } catch (e) {
    console.error("[appkit] Arc balance read failed:", e);
  }

  // Merge: Arc = live, остальные = demo-данные с реальным адресом
  const chains = MOCK_BALANCES.chains.map((c) => {
    if (c.chainId === "Arc_Testnet") {
      return {
        ...c,
        confirmedBalance: arcBalance,
        pendingBalance: "0.00",
        depositorAddress: walletAddress,
        isLive: true,
      };
    }
    return { ...c, depositorAddress: walletAddress };
  });

  const totalConfirmed = chains
    .reduce((sum, c) => sum + parseFloat(c.confirmedBalance || "0"), 0)
    .toFixed(2);

  return {
    isDemo: false,
    networkType: "testnet",
    token: "USDC",
    totalConfirmed,
    totalPending: MOCK_BALANCES.totalPending,
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
  const vaultAddress = process.env.VAULT_ADDRESS;

  // ── Demo mode ───────────────────────────────────────────────────────────────
  if (!privateKey || !vaultAddress) {
    await sleep(2000);
    const txs = generateMockConsolidationTxs(
      req.sourceChains,
      req.targetChainId,
      req.amount
    );
    return { success: true, transactions: txs };
  }

  // ── Live mode — реальная транзакция на Arc Testnet ──────────────────────────
  try {
    const account = privateKeyToAccount(privateKey as `0x${string}`);

    const walletClient = createWalletClient({
      account,
      chain: ARC_CHAIN,
      transport: http("https://rpc.testnet.arc.network", { timeout: 30000 }),
    });

    // Проверяем текущий баланс
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

    // Отправляем USDC на vault
    const amountUnits = parseUnits(req.amount, 6);

    const txHash = await walletClient.writeContract({
      address: ARC_USDC as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [vaultAddress as `0x${string}`, amountUnits],
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

    console.log(`[appkit] Consolidation tx: ${txHash}`);
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
