"use client";

import { useCallback, useEffect, useState } from "react";
import { ChainCard } from "@/components/ChainCard";
import { TotalBalance } from "@/components/TotalBalance";
import { ConsolidateModal } from "@/components/ConsolidateModal";
import { TransactionLog } from "@/components/TransactionLog";
import { ConnectButton } from "@/components/ConnectButton";
import { BridgeModal } from "@/components/BridgeModal";
import { useWallet } from "@/hooks/useWallet";
import { getChains } from "@/lib/chains";
import type { BalancesResponse, Transaction } from "@/lib/types";
import { AlertCircle, ArrowLeftRight, Zap } from "lucide-react";

const NETWORK: "testnet" | "mainnet" = "testnet";

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ChainCardSkeleton() {
  return (
    <div className="rounded-xl border border-[#1a1d2e] bg-[#0d0f18] p-4 animate-pulse">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-lg skeleton" />
        <div className="h-3 w-16 skeleton rounded" />
      </div>
      <div className="h-6 w-20 skeleton rounded mb-1" />
      <div className="h-2.5 w-12 skeleton rounded" />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const wallet = useWallet();

  const [balances, setBalances] = useState<BalancesResponse | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChains, setSelectedChains] = useState<Set<string>>(new Set());
  const [isConsolidateOpen, setIsConsolidateOpen] = useState(false);
  const [isBridgeOpen, setIsBridgeOpen] = useState(false);

  // ── Data fetching ────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Pass connected wallet address so the API reads its live balances
      const addressParam = wallet.address
        ? `?address=${encodeURIComponent(wallet.address)}`
        : "";
      const [balRes, txRes] = await Promise.all([
        fetch(`/api/balances${addressParam}`),
        fetch("/api/transactions"),
      ]);

      if (!balRes.ok) throw new Error("Ошибка загрузки балансов");
      const bal: BalancesResponse = await balRes.json();
      setBalances(bal);

      if (txRes.ok) {
        const txs: Transaction[] = await txRes.json();
        setTransactions(txs);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Неизвестная ошибка");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Re-fetch when wallet connects/disconnects
  useEffect(() => {
    if (wallet.address !== undefined) {
      fetchData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.address]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function toggleChain(chainId: string) {
    setSelectedChains((prev) => {
      const next = new Set(prev);
      if (next.has(chainId)) next.delete(chainId);
      else next.add(chainId);
      return next;
    });
  }

  function handleConsolidateSuccess(txs: Transaction[]) {
    setTransactions((prev) => [...txs, ...prev]);
    setTimeout(fetchData, 1500);
    setSelectedChains(new Set());
  }

  function handleBridgeSuccess() {
    // Refresh balances after bridge completes
    setTimeout(fetchData, 2000);
  }

  // ── Derived ──────────────────────────────────────────────────────────────────

  const allChains = getChains(NETWORK);

  const chainCards = allChains.map((chain) => {
    const bal = balances?.chains.find((c) => c.chainId === chain.id);
    return {
      chainId: chain.id,
      chainName: chain.name,
      confirmedBalance: bal?.confirmedBalance ?? "0",
      pendingBalance: bal?.pendingBalance ?? "0",
      depositorAddress: bal?.depositorAddress,
      isLive: bal?.isLive,
    };
  });

  const nonEmptyCount = chainCards.filter(
    (c) => parseFloat(c.confirmedBalance) > 0
  ).length;

  return (
    <div className="min-h-screen bg-[#07080d] text-white">
      {/* ── Header ── */}
      <header className="border-b border-[#1a1d2e] bg-[#07080d]/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-[#6c5ce7]/20 border border-[#6c5ce7]/30 flex items-center justify-center">
              <Zap size={14} className="text-[#6c5ce7]" />
            </div>
            <span className="text-sm font-bold text-white/90">
              Unified Balance
            </span>
            <span className="hidden sm:inline text-xs text-white/20 font-medium">
              · Arc + Circle
            </span>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2 min-w-0">
            {/* Network badge */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-[#232640] bg-[#0d0f18] flex-shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-white/40 font-medium">testnet</span>
            </div>

            {/* Bridge button — only when wallet connected */}
            {wallet.address && (
              <button
                onClick={() => setIsBridgeOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all flex-shrink-0"
              >
                <ArrowLeftRight size={12} className="text-blue-400" />
                <span className="text-xs font-medium text-blue-400 hidden sm:inline">
                  Мост
                </span>
              </button>
            )}

            {/* Wallet connect */}
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/10 text-sm text-red-400">
            <AlertCircle size={14} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Wallet connected banner */}
        {wallet.address && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-[#232640] bg-[#0d0f18]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <span className="text-xs text-white/50 truncate font-mono">
                {wallet.address}
              </span>
            </div>
            <button
              onClick={() => setIsBridgeOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6c5ce7]/15 hover:bg-[#6c5ce7]/25 border border-[#6c5ce7]/30 text-xs font-medium text-[#6c5ce7] transition-all flex-shrink-0"
            >
              <ArrowLeftRight size={11} />
              Бридж в Arc
            </button>
          </div>
        )}

        {/* Total balance */}
        {isLoading && !balances ? (
          <div className="rounded-2xl border border-[#232640] bg-[#0d0f18] p-6 animate-pulse">
            <div className="h-3 w-24 skeleton rounded mb-3" />
            <div className="h-10 w-40 skeleton rounded mb-2" />
            <div className="h-3 w-32 skeleton rounded" />
          </div>
        ) : balances ? (
          <TotalBalance
            confirmed={balances.totalConfirmed}
            pending={balances.totalPending}
            isDemo={balances.isDemo}
            isLoading={isLoading}
            onRefresh={fetchData}
            onConsolidate={() => setIsConsolidateOpen(true)}
            selectedCount={selectedChains.size}
            totalChains={nonEmptyCount}
          />
        ) : null}

        {/* Hint */}
        {!isLoading && nonEmptyCount > 0 && (
          <p className="text-xs text-white/25 text-center -mt-2">
            {selectedChains.size > 0
              ? `${selectedChains.size} чейн${selectedChains.size === 1 ? "" : "а"} выбрано — нажми «Консолидировать»`
              : "Нажми на карточку чейна, чтобы выбрать для консолидации"}
          </p>
        )}

        {/* Chain grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">
              Балансы по чейнам
            </h2>
            {selectedChains.size > 0 && (
              <button
                onClick={() => setSelectedChains(new Set())}
                className="text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                Сбросить
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {isLoading && !balances
              ? Array.from({ length: 8 }).map((_, i) => (
                  <ChainCardSkeleton key={i} />
                ))
              : chainCards.map((bal) => (
                  <ChainCard
                    key={bal.chainId}
                    balance={bal}
                    selected={selectedChains.has(bal.chainId)}
                    onToggle={toggleChain}
                    networkType={NETWORK}
                  />
                ))}
          </div>
        </div>

        {/* Tx history */}
        {transactions.length > 0 && (
          <TransactionLog transactions={transactions} networkType={NETWORK} />
        )}

        {/* Footer */}
        <div className="text-center space-y-1.5 pt-2 pb-6">
          <p className="text-xs text-white/15">
            Powered by{" "}
            <a
              href="https://docs.arc.network/app-kit"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white/35 transition-colors"
            >
              Arc App Kit
            </a>{" "}
            &{" "}
            <a
              href="https://developers.circle.com/stablecoins/cctp-getting-started"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white/35 transition-colors"
            >
              Circle CCTP V2
            </a>
          </p>
          {balances?.isDemo && (
            <p className="text-xs text-white/15">
              Demo-режим. Добавь{" "}
              <code className="font-mono bg-white/5 px-1 rounded">
                EVM_PRIVATE_KEY
              </code>{" "}
              в переменные окружения для живых балансов.
            </p>
          )}
        </div>
      </main>

      {/* ── Modals ── */}
      {isConsolidateOpen && balances && (
        <ConsolidateModal
          balances={balances}
          initialSelected={[...selectedChains]}
          onClose={() => setIsConsolidateOpen(false)}
          onSuccess={handleConsolidateSuccess}
          walletAddress={wallet.address ?? undefined}
        />
      )}

      {isBridgeOpen && wallet.address && (
        <BridgeModal
          walletAddress={wallet.address}
          onClose={() => setIsBridgeOpen(false)}
          onSuccess={handleBridgeSuccess}
        />
      )}
    </div>
  );
}
