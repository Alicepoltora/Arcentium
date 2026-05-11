"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";

interface TotalBalanceProps {
  confirmed: string;
  pending: string;
  isDemo: boolean;
  isLoading: boolean;
  onRefresh: () => void;
  onConsolidate: () => void;
  selectedCount: number;
  totalChains: number;
}

// Анимированный счётчик цифр
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const startValRef = useRef(0);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startRef.current = performance.now();
    startValRef.current = display;

    const duration = 800;

    function tick(now: number) {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(startValRef.current + (value - startValRef.current) * ease);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{display.toFixed(2)}</>;
}

export function TotalBalance({
  confirmed,
  pending,
  isDemo,
  isLoading,
  onRefresh,
  onConsolidate,
  selectedCount,
  totalChains,
}: TotalBalanceProps) {
  const confirmedNum = parseFloat(confirmed || "0");
  const pendingNum = parseFloat(pending || "0");
  const total = confirmedNum + pendingNum;

  return (
    <div className="relative rounded-2xl border border-[#232640] bg-[#0d0f18] overflow-hidden p-6">
      {/* Фоновый glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 20% 50%, rgba(108,92,231,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Левая часть — баланс */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
              Unified Balance
            </span>
            {isDemo && (
              <span className="text-[10px] font-bold bg-amber-400/15 text-amber-400 px-2 py-0.5 rounded-full border border-amber-400/20">
                DEMO
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-bold text-white tabular-nums">
              {isLoading ? (
                <span className="opacity-30 animate-pulse">——.——</span>
              ) : (
                <AnimatedNumber value={confirmedNum} />
              )}
            </span>
            <span className="text-lg text-white/40 font-medium">USDC</span>
          </div>

          {pendingNum > 0 && !isLoading && (
            <div className="mt-1 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-sm text-yellow-400/80 tabular-nums">
                +{pendingNum.toFixed(2)} USDC в обработке
              </span>
            </div>
          )}

          <div className="mt-3 flex items-center gap-3 text-xs text-white/30">
            <span>
              {totalChains} чейн{totalChains === 1 ? "" : totalChains < 5 ? "а" : "ов"}
            </span>
            <span>·</span>
            {isDemo ? (
              <span className="flex items-center gap-1">
                <WifiOff size={11} />
                demo-режим
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Wifi size={11} className="text-emerald-400" />
                live-данные
              </span>
            )}
          </div>
        </div>

        {/* Правая часть — кнопки */}
        <div className="flex flex-col gap-2 sm:items-end">
          <button
            onClick={onConsolidate}
            disabled={isLoading || confirmedNum === 0}
            className={`
              relative px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200
              flex items-center gap-2 whitespace-nowrap
              ${
                confirmedNum > 0 && !isLoading
                  ? "bg-[#6c5ce7] hover:bg-[#7c6cf7] text-white shadow-lg shadow-[#6c5ce7]/30 hover:shadow-[#6c5ce7]/50 active:scale-[0.98]"
                  : "bg-white/5 text-white/20 cursor-not-allowed"
              }
            `}
          >
            <span className="text-base">⚡</span>
            {selectedCount > 0
              ? `Консолидировать ${selectedCount} чейн${selectedCount === 1 ? "" : "а"}`
              : "Консолидировать всё"}
            {total > 0 && (
              <span className="ml-1 opacity-70">
                →{" "}
                <AnimatedNumber
                  value={confirmedNum * 0.999}
                />
              </span>
            )}
          </button>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors px-1"
          >
            <RefreshCw
              size={11}
              className={isLoading ? "animate-spin" : ""}
            />
            Обновить
          </button>
        </div>
      </div>

      {/* Прогресс-бар */}
      {!isLoading && total > 0 && (
        <div className="mt-5 h-1 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] transition-all duration-1000"
            style={{ width: `${Math.min(100, (confirmedNum / total) * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
