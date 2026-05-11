"use client";

import { getChainById } from "@/lib/chains";
import type { Transaction } from "@/lib/types";
import { ArrowDownLeft, ArrowUpRight, ExternalLink, Loader2 } from "lucide-react";

interface TransactionLogProps {
  transactions: Transaction[];
  networkType: "testnet" | "mainnet";
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}с назад`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}м назад`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}ч назад`;
  return `${Math.floor(h / 24)}д назад`;
}

export function TransactionLog({ transactions, networkType }: TransactionLogProps) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-[#1a1d2e] bg-[#0d0f18] p-6 text-center">
        <p className="text-sm text-white/30">Транзакций ещё нет</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#1a1d2e] bg-[#0d0f18] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#1a1d2e]">
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">
          История транзакций
        </h2>
      </div>

      <div className="divide-y divide-[#1a1d2e]">
        {transactions.map((tx) => {
          const chain = getChainById(
            tx.type === "spend" && tx.targetChainId
              ? tx.targetChainId
              : tx.chainId,
            networkType
          );
          const color = chain?.color ?? "#6c5ce7";
          const isDeposit = tx.type === "deposit";

          return (
            <div
              key={tx.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
            >
              {/* Иконка типа */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: `${color}18`,
                  border: `1px solid ${color}30`,
                }}
              >
                {isDeposit ? (
                  <ArrowDownLeft size={14} style={{ color }} />
                ) : (
                  <ArrowUpRight size={14} style={{ color }} />
                )}
              </div>

              {/* Детали */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white/80">
                    {isDeposit ? "Депозит" : "Spend"} •{" "}
                    <span style={{ color: `${color}cc` }}>
                      {chain?.shortName ?? tx.chainId}
                    </span>
                  </span>

                  {tx.status === "pending" && (
                    <Loader2 size={10} className="text-yellow-400/70 animate-spin" />
                  )}
                </div>

                <div className="flex items-center gap-2 mt-0.5">
                  {tx.txHash && (
                    <span className="text-[10px] text-white/25 font-mono">
                      {tx.txHash.slice(0, 10)}…
                    </span>
                  )}
                  <span className="text-[10px] text-white/25">
                    {timeAgo(tx.timestamp)}
                  </span>
                </div>
              </div>

              {/* Сумма */}
              <div className="text-right flex-shrink-0">
                <div
                  className={`text-sm font-bold tabular-nums ${
                    isDeposit ? "text-emerald-400" : "text-white/70"
                  }`}
                >
                  {isDeposit ? "+" : ""}
                  {parseFloat(tx.amount).toFixed(2)}
                </div>
                <div className="text-[10px] text-white/25 mt-0.5">USDC</div>
              </div>

              {/* Ссылка на эксплорер */}
              {tx.explorerUrl && (
                <a
                  href={tx.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 text-white/20 hover:text-white/60 transition-colors ml-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
