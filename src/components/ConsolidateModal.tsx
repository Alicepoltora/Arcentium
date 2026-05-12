"use client";

import { useEffect, useState } from "react";
import { getChainById, getChains, getPrimaryChain } from "@/lib/chains";
import type {
  BalancesResponse,
  ConsolidateRequest,
  ConsolidateResponse,
  Transaction,
} from "@/lib/types";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Loader2,
  X,
  XCircle,
} from "lucide-react";

type Step = "select" | "configure" | "processing" | "done" | "error";

interface ConsolidateModalProps {
  balances: BalancesResponse;
  initialSelected: string[];
  onClose: () => void;
  onSuccess: (txs: Transaction[]) => void;
  /** Connected wallet address — used as recipient automatically */
  walletAddress?: string;
}

export function ConsolidateModal({
  balances,
  initialSelected,
  onClose,
  onSuccess,
  walletAddress,
}: ConsolidateModalProps) {
  const network = balances.networkType;
  const allChains = getChains(network);
  const primaryChain = getPrimaryChain(network);

  // ── State ──────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("select");
  const [selected, setSelected] = useState<Set<string>>(
    new Set(
      initialSelected.length > 0
        ? initialSelected
        : balances.chains
            .filter(
              (c) =>
                parseFloat(c.confirmedBalance) > 0 &&
                c.chainId !== primaryChain.id
            )
            .map((c) => c.chainId)
    )
  );
  const [targetChainId, setTargetChainId] = useState(primaryChain.id);
  // Prefer connected wallet; fall back to depositor address from env
  const [recipientAddress, setRecipientAddress] = useState(
    walletAddress ||
      balances.chains.find((c) => c.depositorAddress)?.depositorAddress ||
      ""
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultTxs, setResultTxs] = useState<Transaction[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [showTargetDropdown, setShowTargetDropdown] = useState(false);

  // Блокируем скролл фона
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // ── Computed ───────────────────────────────────────────────────────────────
  const selectedChains = balances.chains.filter((c) => selected.has(c.chainId));
  const totalAmount = selectedChains
    .reduce((sum, c) => sum + parseFloat(c.confirmedBalance), 0)
    .toFixed(2);
  const estimatedFee = (parseFloat(totalAmount) * 0.001).toFixed(4);
  const youReceive = Math.max(
    0,
    parseFloat(totalAmount) - parseFloat(estimatedFee)
  ).toFixed(4);

  const targetChain = getChainById(targetChainId, network);
  const targetColor = targetChain?.color ?? "#6c5ce7";

  function toggleChain(chainId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(chainId)) next.delete(chainId);
      else next.add(chainId);
      return next;
    });
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  async function handleConsolidate() {
    setIsProcessing(true);
    setStep("processing");

    const req: ConsolidateRequest = {
      sourceChains: [...selected],
      targetChainId,
      recipientAddress: recipientAddress || "0x0000000000000000000000000000000000000001",
      amount: totalAmount,
    };

    try {
      const res = await fetch("/api/consolidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });

      const data: ConsolidateResponse = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Ошибка консолидации");
      }

      setResultTxs(data.transactions);
      setStep("done");
      onSuccess(data.transactions);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Неизвестная ошибка");
      setStep("error");
    } finally {
      setIsProcessing(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-[#232640] bg-[#0d0f18] overflow-hidden animate-slide-up"
        style={{
          boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1d2e]">
          <div>
            <h2 className="text-sm font-bold text-white">Консолидация USDC</h2>
            <p className="text-xs text-white/40 mt-0.5">
              {step === "select" && "Шаг 1 / 2 — Источники"}
              {step === "configure" && "Шаг 2 / 2 — Назначение"}
              {step === "processing" && "Выполняется..."}
              {step === "done" && "Готово!"}
              {step === "error" && "Ошибка"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Step: Select sources ── */}
        {step === "select" && (
          <div className="p-5 space-y-3">
            <p className="text-xs text-white/40">
              Выбери чейны-источники. Только подтверждённые балансы.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scroll">
              {balances.chains
                .filter((c) => c.chainId !== primaryChain.id)
                .map((c) => {
                  const confirmed = parseFloat(c.confirmedBalance);
                  const chain = getChainById(c.chainId, network);
                  const color = chain?.color ?? "#6c5ce7";
                  const isChecked = selected.has(c.chainId);
                  const isEmpty = confirmed === 0;

                  return (
                    <button
                      key={c.chainId}
                      onClick={() => !isEmpty && toggleChain(c.chainId)}
                      disabled={isEmpty}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all
                        ${isChecked
                          ? "border-white/20 bg-white/5"
                          : isEmpty
                          ? "border-[#1a1d2e] opacity-30 cursor-not-allowed"
                          : "border-[#1a1d2e] hover:border-[#2a2d42]"
                        }
                      `}
                    >
                      {/* Checkbox */}
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                          isChecked ? "border-0" : "border-white/20"
                        }`}
                        style={isChecked ? { backgroundColor: color } : {}}
                      >
                        {isChecked && (
                          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                            <path
                              d="M1.5 5l2.5 2.5 4.5-4.5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>

                      {/* Chain icon */}
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: `${color}22`, color }}
                      >
                        {chain?.icon}
                      </div>

                      {/* Name */}
                      <span className="text-sm text-white/80 flex-1 text-left">
                        {chain?.shortName ?? c.chainId}
                      </span>

                      {/* Balance */}
                      <span
                        className={`text-sm font-bold tabular-nums ${
                          isEmpty ? "text-white/20" : "text-white"
                        }`}
                      >
                        {confirmed.toFixed(2)}
                      </span>
                      <span className="text-xs text-white/30">USDC</span>
                    </button>
                  );
                })}
            </div>

            {/* Итог */}
            <div className="flex items-center justify-between pt-2 border-t border-[#1a1d2e]">
              <span className="text-xs text-white/40">
                Выбрано: {selected.size} чейн{selected.size === 1 ? "" : "а"}
              </span>
              <span className="text-sm font-bold text-white tabular-nums">
                {totalAmount} USDC
              </span>
            </div>

            <button
              onClick={() => setStep("configure")}
              disabled={selected.size === 0 || parseFloat(totalAmount) === 0}
              className={`
                w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all
                ${selected.size > 0 && parseFloat(totalAmount) > 0
                  ? "bg-[#6c5ce7] text-white hover:bg-[#7c6cf7] active:scale-[0.99]"
                  : "bg-white/5 text-white/20 cursor-not-allowed"
                }
              `}
            >
              Далее
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* ── Step: Configure destination ── */}
        {step === "configure" && (
          <div className="p-5 space-y-4">
            {/* Target chain */}
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">
                Целевой чейн
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowTargetDropdown(!showTargetDropdown)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#232640] bg-[#131520] hover:border-[#3a3d58] transition-colors text-left"
                >
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      backgroundColor: `${targetColor}22`,
                      color: targetColor,
                    }}
                  >
                    {targetChain?.icon}
                  </div>
                  <span className="text-sm text-white flex-1">
                    {targetChain?.name}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-white/30 transition-transform ${
                      showTargetDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showTargetDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-[#232640] bg-[#0d0f18] overflow-hidden z-10 shadow-xl">
                    {allChains.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setTargetChainId(c.id);
                          setShowTargetDropdown(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
                      >
                        <div
                          className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ color: c.color }}
                        >
                          {c.icon}
                        </div>
                        <span className="text-xs text-white/80">{c.name}</span>
                        {c.isPrimary && (
                          <span className="ml-auto text-[10px] text-[#6c5ce7]">
                            рекомендуется
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recipient */}
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">
                Адрес получателя
              </label>
              {walletAddress ? (
                /* Wallet connected — show as read-only badge */
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                  <span className="text-xs font-mono text-emerald-400/90 truncate flex-1">
                    {walletAddress}
                  </span>
                  <span className="text-[10px] text-emerald-400/50 flex-shrink-0">
                    кошелёк
                  </span>
                </div>
              ) : (
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="0x… или оставь пустым для demo"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#232640] bg-[#131520] text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#6c5ce7]/50 transition-colors font-mono"
                />
              )}
            </div>

            {/* Fee preview */}
            <div className="rounded-xl border border-[#1a1d2e] bg-[#0a0b0f] p-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Сумма к отправке</span>
                <span className="text-white tabular-nums font-medium">
                  {totalAmount} USDC
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Примерная комиссия (~0.1%)</span>
                <span className="text-white/60 tabular-nums">
                  −{estimatedFee} USDC
                </span>
              </div>
              <div className="flex justify-between text-xs pt-1.5 border-t border-[#1a1d2e]">
                <span className="text-white/70 font-semibold">Получите</span>
                <span
                  className="font-bold tabular-nums"
                  style={{ color: targetColor }}
                >
                  ≈{youReceive} USDC
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep("select")}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white/40 border border-[#1a1d2e] hover:border-[#232640] transition-colors"
              >
                ← Назад
              </button>
              <button
                onClick={handleConsolidate}
                className="flex-[2] py-3 rounded-xl text-sm font-semibold bg-[#6c5ce7] text-white hover:bg-[#7c6cf7] transition-colors flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                Подтвердить
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Processing ── */}
        {step === "processing" && (
          <div className="p-8 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#6c5ce7]/20 border border-[#6c5ce7]/30 flex items-center justify-center">
              <Loader2 size={24} className="text-[#6c5ce7] animate-spin" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Выполняем консолидацию</p>
              <p className="text-xs text-white/40 mt-1">
                Депозиты из {selected.size} чейнов → {targetChain?.shortName}
              </p>
            </div>
            <div className="w-full space-y-2 text-left">
              {[...selected].map((chainId, i) => {
                const chain = getChainById(chainId, network);
                return (
                  <div key={chainId} className="flex items-center gap-2 text-xs">
                    <Loader2
                      size={12}
                      className="text-[#6c5ce7] animate-spin flex-shrink-0"
                      style={{ animationDelay: `${i * 200}ms` }}
                    />
                    <span className="text-white/50">
                      Депозит из {chain?.shortName ?? chainId}…
                    </span>
                  </div>
                );
              })}
              <div className="flex items-center gap-2 text-xs opacity-30">
                <Loader2 size={12} className="flex-shrink-0" />
                <span className="text-white/50">
                  Spend на {targetChain?.shortName}… (ожидаем депозиты)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Step: Done ── */}
        {step === "done" && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col items-center gap-3 text-center py-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-400/15 border border-emerald-400/30 flex items-center justify-center">
                <CheckCircle2 size={24} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Консолидировано!</p>
                <p className="text-xs text-white/40 mt-1">
                  {parseFloat(youReceive).toFixed(4)} USDC отправлено на{" "}
                  {targetChain?.shortName}
                </p>
              </div>
            </div>

            {/* Транзакции */}
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {resultTxs.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] text-xs"
                >
                  <CheckCircle2 size={11} className="text-emerald-400 flex-shrink-0" />
                  <span className="text-white/60 flex-1">
                    {tx.type === "deposit"
                      ? `Депозит из ${getChainById(tx.chainId, network)?.shortName}`
                      : `Spend → ${getChainById(tx.targetChainId ?? tx.chainId, network)?.shortName}`}
                  </span>
                  <span className="text-white/40 tabular-nums">
                    {parseFloat(tx.amount).toFixed(2)} USDC
                  </span>
                  {tx.explorerUrl && (
                    <a
                      href={tx.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/25 hover:text-white/60 transition-colors"
                    >
                      <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-[#6c5ce7] text-white hover:bg-[#7c6cf7] transition-colors"
            >
              Готово
            </button>
          </div>
        )}

        {/* ── Step: Error ── */}
        {step === "error" && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col items-center gap-3 text-center py-2">
              <div className="w-14 h-14 rounded-2xl bg-red-400/15 border border-red-400/30 flex items-center justify-center">
                <XCircle size={24} className="text-red-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Ошибка</p>
                <p className="text-xs text-red-400/80 mt-1 font-mono">{errorMsg}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep("configure")}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white/40 border border-[#1a1d2e] hover:border-[#232640] transition-colors"
              >
                Назад
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl text-sm font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
