"use client";

import { getChainById } from "@/lib/chains";
import type { ChainBalance } from "@/lib/types";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";

interface ChainCardProps {
  balance: ChainBalance;
  selected: boolean;
  onToggle: (chainId: string) => void;
  networkType: "testnet" | "mainnet";
}

export function ChainCard({
  balance,
  selected,
  onToggle,
  networkType,
}: ChainCardProps) {
  const chain = getChainById(balance.chainId, networkType);
  const confirmed = parseFloat(balance.confirmedBalance);
  const pending = parseFloat(balance.pendingBalance);
  const total = confirmed + pending;
  const isEmpty = total === 0;

  const color = chain?.color ?? "#6c5ce7";

  return (
    <button
      onClick={() => !isEmpty && onToggle(balance.chainId)}
      disabled={isEmpty}
      className={`
        group relative w-full text-left rounded-xl border p-4 transition-all duration-200
        ${
          selected
            ? "border-[var(--chain-color)] shadow-[0_0_0_1px_var(--chain-color),0_0_20px_var(--chain-glow)]"
            : isEmpty
            ? "border-[#1a1d2e] opacity-40 cursor-not-allowed"
            : "border-[#1a1d2e] hover:border-[#2a2d42] hover:shadow-md"
        }
        bg-[#0d0f18]
      `}
      style={
        {
          "--chain-color": color,
          "--chain-glow": `${color}40`,
        } as React.CSSProperties
      }
    >
      {/* Selection checkmark */}
      {selected && (
        <div
          className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: color }}
        >
          <CheckCircle2 size={12} className="text-white" strokeWidth={3} />
        </div>
      )}

      {/* Chain icon + name */}
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold select-none flex-shrink-0"
          style={{
            backgroundColor: `${color}22`,
            color: color,
            border: `1px solid ${color}44`,
          }}
        >
          {chain?.icon ?? "?"}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-white/90 truncate">
            {chain?.shortName ?? balance.chainName}
          </div>
          {networkType === "testnet" && (
            <div className="text-[10px] text-white/30 leading-none mt-0.5">
              testnet
            </div>
          )}
        </div>
      </div>

      {/* Balance */}
      <div className="space-y-1">
        <div className="flex items-baseline gap-1">
          <span
            className={`text-xl font-bold tabular-nums ${
              isEmpty ? "text-white/20" : "text-white"
            }`}
          >
            {confirmed.toFixed(2)}
          </span>
          <span className="text-xs text-white/40 font-medium">USDC</span>
        </div>

        {pending > 0 && (
          <div className="flex items-center gap-1">
            <Loader2
              size={10}
              className="text-yellow-400/70 animate-spin flex-shrink-0"
            />
            <span className="text-[11px] text-yellow-400/70 tabular-nums">
              +{pending.toFixed(2)} pending
            </span>
          </div>
        )}

        {!isEmpty && pending === 0 && (
          <div className="flex items-center gap-1">
            <CheckCircle2 size={10} className="text-emerald-400/50 flex-shrink-0" />
            <span className="text-[11px] text-emerald-400/50">confirmed</span>
          </div>
        )}
      </div>

      {/* Progress bar showing % of total portfolio */}
      {!isEmpty && (
        <div className="mt-3 h-0.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(100, (confirmed / 10) * 100)}%`,
              backgroundColor: color,
              opacity: 0.6,
            }}
          />
        </div>
      )}

      {/* Badges row */}
      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
        {chain?.isPrimary && !isEmpty && (
          <div
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded"
            style={{ backgroundColor: `${color}22`, color: color }}
          >
            ⚡ Arc — цель
          </div>
        )}
        {balance.isLive && !isEmpty && (
          <div className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            LIVE
          </div>
        )}
      </div>
    </button>
  );
}
