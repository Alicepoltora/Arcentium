/**
 * Чтение USDC-балансов через viem (публичные RPC-эндпоинты).
 *
 * Логика:
 *  - Если WALLET_ADDRESS задан → реальные запросы к EVM-чейнам через публичные RPC
 *  - Если не задан → возвращает mock-данные (demo-режим)
 *
 * Solana и другие не-EVM чейны всегда используют mock (нет viem-поддержки).
 * Consolidate() работает в симуляции — для реальных транзакций нужен приватный ключ.
 */

import { createPublicClient, http, formatUnits } from "viem";
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

// Минимальный ABI для ERC-20 balanceOf
const ERC20_BALANCE_ABI = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

export function isConfigured(): boolean {
  return !!process.env.WALLET_ADDRESS;
}

// ─── Balances ───────────────────────────────────────────────────────────────

export async function fetchBalances(): Promise<BalancesResponse> {
  const walletAddress = process.env.WALLET_ADDRESS;

  if (!walletAddress) {
    // Demo-режим: возвращаем мок с актуальным временем
    return { ...MOCK_BALANCES, fetchedAt: new Date().toISOString() };
  }

  const chainResults = await Promise.allSettled(
    TESTNET_CHAINS.map(async (chain) => {
      // Solana и чейны без RPC-конфига — пропускаем (используем 0)
      if (!chain.rpcUrl || !chain.usdcAddress) {
        return {
          chainId: chain.id,
          chainName: chain.name,
          confirmedBalance: "0",
          pendingBalance: "0",
          depositorAddress: walletAddress,
        };
      }

      const client = createPublicClient({
        chain: {
          id: chain.chainId!,
          name: chain.name,
          nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
          rpcUrls: { default: { http: [chain.rpcUrl] } },
        },
        transport: http(chain.rpcUrl, { timeout: 8000 }),
      });

      const raw = await client.readContract({
        address: chain.usdcAddress as `0x${string}`,
        abi: ERC20_BALANCE_ABI,
        functionName: "balanceOf",
        args: [walletAddress as `0x${string}`],
      });

      const balance = formatUnits(raw, 6); // USDC = 6 decimals

      return {
        chainId: chain.id,
        chainName: chain.name,
        confirmedBalance: balance,
        pendingBalance: "0",
        depositorAddress: walletAddress,
      };
    })
  );

  const chains = chainResults.map((result, i) => {
    if (result.status === "fulfilled") return result.value;
    // Если чейн недоступен — возвращаем 0 без падения
    return {
      chainId: TESTNET_CHAINS[i].id,
      chainName: TESTNET_CHAINS[i].name,
      confirmedBalance: "0",
      pendingBalance: "0",
      depositorAddress: walletAddress,
    };
  });

  const totalConfirmed = chains
    .reduce((sum, c) => sum + parseFloat(c.confirmedBalance || "0"), 0)
    .toFixed(6);

  return {
    isDemo: false,
    networkType: "testnet",
    token: "USDC",
    totalConfirmed,
    totalPending: "0",
    chains,
    fetchedAt: new Date().toISOString(),
  };
}

// ─── Consolidate ─────────────────────────────────────────────────────────────
// Для реального consolidate нужен приватный ключ + Circle App Kit (будущая фича).
// Пока — симуляция с визуальным feedback.

export async function consolidate(
  req: ConsolidateRequest
): Promise<ConsolidateResponse> {
  await sleep(2000);
  const txs = generateMockConsolidationTxs(
    req.sourceChains,
    req.targetChainId,
    req.amount
  );
  return { success: true, transactions: txs };
}

// ─── Transaction history ─────────────────────────────────────────────────────

export async function fetchTransactions(): Promise<Transaction[]> {
  return MOCK_TRANSACTIONS;
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
