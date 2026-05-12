"use client";

import { useState } from "react";
import { Wallet, LogOut, ChevronDown, ExternalLink } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";

export function ConnectButton() {
  const { address, chainId, isConnecting, hasMetaMask, connect, disconnect } =
    useWallet();
  const [showMenu, setShowMenu] = useState(false);

  if (address) {
    const short = `${address.slice(0, 6)}…${address.slice(-4)}`;

    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu((v) => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#232640] bg-[#0d0f18] hover:border-[#3a3d5a] transition-all"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <span className="font-mono text-xs text-white/70">{short}</span>
          <ChevronDown
            size={11}
            className={`text-white/30 transition-transform ${showMenu ? "rotate-180" : ""}`}
          />
        </button>

        {showMenu && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />

            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-1.5 z-50 w-48 rounded-xl border border-[#232640] bg-[#0d0f18] shadow-2xl overflow-hidden">
              {/* Address row */}
              <div className="px-3 py-2.5 border-b border-[#1a1d2e]">
                <p className="text-[10px] text-white/30 mb-0.5">Кошелёк</p>
                <p className="font-mono text-xs text-white/60 truncate">
                  {address}
                </p>
                {chainId && (
                  <p className="text-[10px] text-white/25 mt-0.5">
                    Chain ID: {chainId}
                  </p>
                )}
              </div>

              {/* View on explorer */}
              <a
                href={`https://testnet.arcscan.app/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
                onClick={() => setShowMenu(false)}
              >
                <ExternalLink size={11} />
                Arc Explorer
              </a>

              {/* Disconnect */}
              <button
                onClick={() => {
                  disconnect();
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400/70 hover:text-red-400 hover:bg-red-500/5 transition-colors"
              >
                <LogOut size={11} />
                Отключить
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={isConnecting}
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#6c5ce7]/40 bg-[#6c5ce7]/10 hover:bg-[#6c5ce7]/20 hover:border-[#6c5ce7]/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
    >
      <Wallet size={13} className="text-[#6c5ce7] flex-shrink-0" />
      <span className="text-xs font-medium text-white/80">
        {isConnecting
          ? "Подключение…"
          : !hasMetaMask
          ? "Установить MetaMask"
          : "Подключить кошелёк"}
      </span>
    </button>
  );
}
