"use client";

import { useState } from "react";
import {
  X,
  ArrowRight,
  Loader2,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  ArrowLeftRight,
} from "lucide-react";
import { TESTNET_CHAINS, type ChainConfig } from "@/lib/chains";
import { bridgeToArc, CCTP_DOMAINS, type BridgeStep } from "@/lib/cctp";

// Only EVM chains that have CCTP domains and USDC addresses (not Arc itself as source)
const BRIDGE_SOURCE_CHAINS = TESTNET_CHAINS.filter(
  (c) =>
    c.id !== "Arc_Testnet" &&
    c.id !== "Solana_Devnet" &&
    CCTP_DOMAINS[c.id] !== undefined &&
    c.usdcAddress != null &&
    c.rpcUrl != null
);

interface BridgeModalProps {
  walletAddress: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function BridgeModal({
  walletAddress,
  onClose,
  onSuccess,
}: BridgeModalProps) {
  const [sourceChainId, setSourceChainId] = useState(
    BRIDGE_SOURCE_CHAINS[0]?.id ?? ""
  );
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<BridgeStep>({ status: "idle" });

  const sourceChain = TESTNET_CHAINS.find((c) => c.id === sourceChainId);
  const isRunning = !["idle", "done", "error"].includes(step.status);
  const isDone = step.status === "done";
  const isError = step.status === "error";

  async function startBridge() {
    if (!sourceChain || !amount || parseFloat(amount) <= 0) return;

    try {
      await bridgeToArc(
        { sourceChain, amount, recipientAddress: walletAddress },
        setStep
      );
    } catch (e: any) {
      setStep({ status: "error", message: e.message ?? "Ошибка моста" });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={!isRunning ? onClose : undefined}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-[#232640] bg-[#0d0f18] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#1a1d2e]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#6c5ce7]/20 border border-[#6c5ce7]/30 flex items-center justify-center">
              <ArrowLeftRight size={13} className="text-[#6c5ce7]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-none">
                Мост USDC → Arc Testnet
              </h2>
              <p className="text-[10px] text-white/30 mt-0.5">Circle CCTP V2</p>
            </div>
          </div>
          {!isRunning && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X size={14} className="text-white/40" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          {step.status === "idle" && (
            <IdleForm
              sourceChainId={sourceChainId}
              setSourceChainId={setSourceChainId}
              amount={amount}
              setAmount={setAmount}
              sourceChain={sourceChain}
              onStart={startBridge}
            />
          )}

          {isRunning && (
            <BridgeProgress step={step} sourceChain={sourceChain} />
          )}

          {isDone && step.status === "done" && (
            <BridgeSuccess
              burnTxHash={step.burnTxHash}
              mintTxHash={step.mintTxHash}
              sourceChain={sourceChain}
              onClose={() => {
                onSuccess();
                onClose();
              }}
            />
          )}

          {isError && step.status === "error" && (
            <BridgeError
              message={step.message}
              onRetry={() => setStep({ status: "idle" })}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

function IdleForm({
  sourceChainId,
  setSourceChainId,
  amount,
  setAmount,
  sourceChain,
  onStart,
}: {
  sourceChainId: string;
  setSourceChainId: (id: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  sourceChain: ChainConfig | undefined;
  onStart: () => void;
}) {
  const canSubmit = !!amount && parseFloat(amount) > 0;

  return (
    <div className="space-y-5">
      {/* Source chain picker */}
      <div>
        <label className="text-xs font-semibold text-white/40 uppercase tracking-wider block mb-2">
          Исходная сеть
        </label>
        <div className="grid grid-cols-3 gap-2">
          {BRIDGE_SOURCE_CHAINS.map((chain) => (
            <button
              key={chain.id}
              onClick={() => setSourceChainId(chain.id)}
              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-center transition-all duration-150 ${
                sourceChainId === chain.id
                  ? "border-[var(--c)] shadow-[0_0_14px_var(--cg)]"
                  : "border-[#1a1d2e] hover:border-[#2a2d42]"
              }`}
              style={
                {
                  "--c": chain.color,
                  "--cg": `${chain.color}33`,
                } as React.CSSProperties
              }
            >
              <span className="text-lg leading-none">{chain.icon}</span>
              <span
                className="text-[11px] font-medium leading-none"
                style={{
                  color:
                    sourceChainId === chain.id
                      ? chain.color
                      : "rgba(255,255,255,0.45)",
                }}
              >
                {chain.shortName}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div>
        <label className="text-xs font-semibold text-white/40 uppercase tracking-wider block mb-2">
          Сумма
        </label>
        <div className="relative">
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-[#07080d] border border-[#1a1d2e] rounded-xl px-4 py-3 text-white text-base font-mono placeholder:text-white/20 focus:outline-none focus:border-[#6c5ce7]/50 transition-colors"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/30 font-medium">
            USDC
          </span>
        </div>
      </div>

      {/* Route preview */}
      {sourceChain && (
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.025] border border-[#1a1d2e]">
          <span style={{ color: sourceChain.color }} className="text-base">
            {sourceChain.icon}
          </span>
          <span className="text-xs text-white/50">{sourceChain.shortName}</span>
          <ArrowRight size={12} className="text-white/15 flex-shrink-0 mx-auto" />
          <span className="text-base">⚡</span>
          <span className="text-xs text-white/50">Arc Testnet</span>
          <span className="ml-auto text-[10px] text-white/20 whitespace-nowrap">
            ~3–5 мин
          </span>
        </div>
      )}

      {/* Info */}
      <p className="text-[11px] text-white/25 leading-relaxed">
        USDC сжигается на {sourceChain?.name ?? "исходной сети"} через Circle
        CCTP V2 и минтится на Arc Testnet. Необходим MetaMask с USDC на
        исходной сети.
      </p>

      <button
        onClick={onStart}
        disabled={!canSubmit}
        className="w-full py-3 rounded-xl bg-[#6c5ce7] hover:bg-[#7d6ef0] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-bold text-white"
      >
        Начать бридж
      </button>
    </div>
  );
}

function BridgeProgress({
  step,
  sourceChain,
}: {
  step: BridgeStep;
  sourceChain: ChainConfig | undefined;
}) {
  const STEPS = [
    { key: "approving", label: "Разрешение USDC" },
    {
      key: "burning",
      label: `Сжигание на ${sourceChain?.shortName ?? "source"}`,
    },
    { key: "attesting", label: "Подтверждение Circle" },
    { key: "minting", label: "Минтинг на Arc Testnet" },
  ];

  // Map status to step index
  const statusToIdx: Record<string, number> = {
    approving: 0,
    burning: 1,
    burned: 1,
    attesting: 2,
    minting: 3,
    done: 4,
  };

  const currentIdx = statusToIdx[step.status] ?? -1;

  // Extract txHash if present in step
  let txHash: string | undefined;
  if (
    step.status === "burned" ||
    step.status === "attesting" ||
    step.status === "minting"
  ) {
    txHash = step.txHash;
  }

  let attestingProgress = 0;
  if (step.status === "attesting") {
    attestingProgress = step.progress;
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        {STEPS.map((s, i) => {
          const isDone = i < currentIdx;
          const isCurrent = i === currentIdx;
          const isPending = i > currentIdx;

          return (
            <div
              key={s.key}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                isCurrent
                  ? "border-[#6c5ce7]/40 bg-[#6c5ce7]/10"
                  : isDone
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : "border-[#1a1d2e] opacity-30"
              }`}
            >
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                {isDone ? (
                  <CheckCircle2 size={14} className="text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2
                    size={14}
                    className="text-[#6c5ce7] animate-spin"
                  />
                ) : (
                  <div className="w-3 h-3 rounded-full border border-white/20" />
                )}
              </div>

              <span
                className={`text-xs font-medium flex-1 ${
                  isCurrent
                    ? "text-white"
                    : isDone
                    ? "text-emerald-400/80"
                    : "text-white/30"
                }`}
              >
                {s.label}
              </span>

              {isCurrent && s.key === "attesting" && (
                <span className="text-[10px] text-white/30 tabular-nums">
                  {attestingProgress}%
                </span>
              )}
            </div>
          );
        })}
      </div>

      {txHash && (
        <div className="text-center">
          <a
            href={`${sourceChain?.explorerUrl}/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-white/25 hover:text-white/60 transition-colors"
          >
            Burn tx на {sourceChain?.shortName}
            <ExternalLink size={10} />
          </a>
        </div>
      )}

      <p className="text-center text-[11px] text-white/20">
        Не закрывай окно — ожидание аттестации Circle…
      </p>
    </div>
  );
}

function BridgeSuccess({
  burnTxHash,
  mintTxHash,
  sourceChain,
  onClose,
}: {
  burnTxHash: string;
  mintTxHash: string;
  sourceChain: ChainConfig | undefined;
  onClose: () => void;
}) {
  return (
    <div className="space-y-5 text-center">
      {/* Success icon */}
      <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
        <CheckCircle2 size={28} className="text-emerald-400" />
      </div>

      <div>
        <h3 className="text-base font-bold text-white mb-1">Бридж завершён!</h3>
        <p className="text-xs text-white/40">
          USDC успешно перемещён на Arc Testnet
        </p>
      </div>

      {/* Tx links */}
      <div className="space-y-2 text-left">
        <a
          href={`${sourceChain?.explorerUrl}/tx/${burnTxHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-[#1a1d2e] hover:border-[#2a2d42] transition-colors group"
        >
          <div className="flex items-center gap-2">
            <span style={{ color: sourceChain?.color }}>{sourceChain?.icon}</span>
            <span className="text-xs text-white/50">
              Burn на {sourceChain?.shortName}
            </span>
          </div>
          <ExternalLink
            size={11}
            className="text-white/25 group-hover:text-white/60"
          />
        </a>

        <a
          href={`https://testnet.arcscan.app/tx/${mintTxHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors group"
        >
          <div className="flex items-center gap-2">
            <span>⚡</span>
            <span className="text-xs text-emerald-400/80">
              Mint на Arc Testnet
            </span>
          </div>
          <ExternalLink
            size={11}
            className="text-emerald-400/40 group-hover:text-emerald-400/80"
          />
        </a>
      </div>

      <button
        onClick={onClose}
        className="w-full py-3 rounded-xl bg-[#6c5ce7] hover:bg-[#7d6ef0] transition-all text-sm font-bold text-white"
      >
        Готово
      </button>
    </div>
  );
}

function BridgeError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/10">
        <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-red-400 leading-relaxed">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="w-full py-2.5 rounded-xl border border-[#232640] text-sm text-white/60 hover:text-white/90 hover:border-[#3a3d5a] transition-all"
      >
        Попробовать снова
      </button>
    </div>
  );
}
