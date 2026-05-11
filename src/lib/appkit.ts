/**
 * Обёртка над @circle-fin/app-kit
 *
 * Логика:
 *  - Если EVM_PRIVATE_KEY задан → реальные запросы к App Kit на testnet
 *  - Если ключей нет → возвращает mock-данные (demo-режим)
 */

import type { BalancesResponse, ConsolidateRequest, ConsolidateResponse, Transaction } from "./types";
import { MOCK_BALANCES, MOCK_TRANSACTIONS, generateMockConsolidationTxs } from "./mock-data";

export function isConfigured(): boolean {
  return !!process.env.EVM_PRIVATE_KEY;
}

// ─── Balances ───────────────────────────────────────────────────────────────

export async function fetchBalances(): Promise<BalancesResponse> {
  if (!isConfigured()) {
    // Demo-режим: возвращаем мок с актуальным временем
    return { ...MOCK_BALANCES, fetchedAt: new Date().toISOString() };
  }

  // Ленивый импорт — App Kit нельзя инициализировать на клиенте
  const { AppKit } = await import("@circle-fin/app-kit");
  const { createViemAdapterFromPrivateKey } = await import(
    "@circle-fin/adapter-viem-v2"
  );

  const kit = new AppKit();

  const evmAdapter = createViemAdapterFromPrivateKey({
    privateKey: process.env.EVM_PRIVATE_KEY as `0x${string}`,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sources: any[] = [{ adapter: evmAdapter }];

  if (process.env.SOLANA_PRIVATE_KEY) {
    const { createSolanaAdapterFromPrivateKey } = await import(
      "@circle-fin/adapter-solana-kit"
    );
    const solanaAdapter = createSolanaAdapterFromPrivateKey({
      privateKey: process.env.SOLANA_PRIVATE_KEY,
    });
    sources.push({ adapter: solanaAdapter });
  }

  const result = await kit.unifiedBalance.getBalances({
    sources,
    networkType: "testnet",
    includePending: true,
  });

  // Нормализуем ответ App Kit в наш формат
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = result as any;
  const chains = (raw.breakdown ?? []).flatMap(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (depositor: any) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (depositor.breakdown ?? []).map((entry: any) => ({
        chainId: entry.chain as string,
        chainName: entry.chain as string,
        confirmedBalance: String(entry.confirmedBalance ?? "0"),
        pendingBalance: String(entry.pendingBalance ?? "0"),
        depositorAddress: depositor.depositor as string,
      }))
  );

  return {
    isDemo: false,
    networkType: "testnet",
    token: "USDC",
    totalConfirmed: String(raw.totalConfirmedBalance ?? "0"),
    totalPending: String(raw.totalPendingBalance ?? "0"),
    chains,
    fetchedAt: new Date().toISOString(),
  };
}

// ─── Consolidate ─────────────────────────────────────────────────────────────

export async function consolidate(
  req: ConsolidateRequest
): Promise<ConsolidateResponse> {
  if (!isConfigured()) {
    // Demo-режим: симулируем задержку и возвращаем фейковые транзакции
    await sleep(2000);
    const txs = generateMockConsolidationTxs(
      req.sourceChains,
      req.targetChainId,
      req.amount
    );
    return { success: true, transactions: txs };
  }

  const { AppKit } = await import("@circle-fin/app-kit");
  const { createViemAdapterFromPrivateKey } = await import(
    "@circle-fin/adapter-viem-v2"
  );

  const kit = new AppKit();

  const evmAdapter = createViemAdapterFromPrivateKey({
    privateKey: process.env.EVM_PRIVATE_KEY as `0x${string}`,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fromSources: any[] = [{ adapter: evmAdapter }];

  if (process.env.SOLANA_PRIVATE_KEY) {
    const { createSolanaAdapterFromPrivateKey } = await import(
      "@circle-fin/adapter-solana-kit"
    );
    const solanaAdapter = createSolanaAdapterFromPrivateKey({
      privateKey: process.env.SOLANA_PRIVATE_KEY,
    });
    fromSources.push({ adapter: solanaAdapter });
  }

  try {
    // Шаг 1: депозиты из каждого источника
    const depositTxs: Transaction[] = [];

    for (const source of fromSources) {
      // Определяем, на каком чейне у этого кошелька есть баланс
      // (В реальной реализации вы бы итерировались по req.sourceChains)
      try {
        const depositResult = await kit.unifiedBalance.deposit({
          from: { adapter: source.adapter, chain: req.sourceChains[0] },
          amount: (parseFloat(req.amount) / fromSources.length).toFixed(2),
          token: "USDC",
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = depositResult as any;
        depositTxs.push({
          id: `dep-${Date.now()}`,
          type: "deposit",
          chainId: req.sourceChains[0],
          amount: req.amount,
          token: "USDC",
          txHash: r.txHash,
          explorerUrl: r.explorerUrl,
          status: "confirmed",
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        console.error("Deposit error:", e);
      }
    }

    // Шаг 2: spend на целевой чейн
    const spendResult = await kit.unifiedBalance.spend({
      amount: req.amount,
      token: "USDC",
      from: fromSources.map((s) => ({ adapter: s.adapter })),
      to: {
        adapter: evmAdapter,
        chain: req.targetChainId,
        recipientAddress: req.recipientAddress,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sr = spendResult as any;
    const spendTx: Transaction = {
      id: `spend-${Date.now()}`,
      type: "spend",
      chainId: req.targetChainId,
      targetChainId: req.targetChainId,
      amount: req.amount,
      token: "USDC",
      txHash: sr.txHash,
      explorerUrl: sr.explorerUrl,
      status: "confirmed",
      timestamp: new Date().toISOString(),
    };

    return {
      success: true,
      transactions: [...depositTxs, spendTx],
    };
  } catch (error) {
    return {
      success: false,
      transactions: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ─── Mock history ─────────────────────────────────────────────────────────────

export async function fetchTransactions(): Promise<Transaction[]> {
  return MOCK_TRANSACTIONS;
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
