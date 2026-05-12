"use client";

import { useState, useEffect, useCallback } from "react";

export interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnecting: boolean;
  error: string | null;
  hasMetaMask: boolean;
}

export function useWallet(): WalletState & {
  connect: () => Promise<void>;
  disconnect: () => void;
} {
  const [state, setState] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnecting: false,
    error: null,
    hasMetaMask: false,
  });

  // Check if MetaMask is installed (client side only)
  useEffect(() => {
    const eth = typeof window !== "undefined" ? (window as any).ethereum : null;
    setState((s) => ({ ...s, hasMetaMask: !!eth }));
  }, []);

  // Check for already-connected accounts on mount
  const checkConnection = useCallback(async () => {
    if (typeof window === "undefined") return;
    const eth = (window as any).ethereum;
    if (!eth) return;

    try {
      const accounts: string[] = await eth.request({ method: "eth_accounts" });
      const chainIdHex: string = await eth.request({ method: "eth_chainId" });

      if (accounts.length > 0) {
        setState((s) => ({
          ...s,
          address: accounts[0],
          chainId: parseInt(chainIdHex, 16),
          hasMetaMask: true,
        }));
      } else {
        setState((s) => ({ ...s, hasMetaMask: true }));
      }
    } catch {
      // Silently ignore
    }
  }, []);

  useEffect(() => {
    checkConnection();

    const eth =
      typeof window !== "undefined" ? (window as any).ethereum : null;
    if (!eth) return;

    const handleAccountsChanged = (accounts: string[]) => {
      setState((s) => ({
        ...s,
        address: accounts[0] ?? null,
      }));
    };

    const handleChainChanged = (chainIdHex: string) => {
      setState((s) => ({
        ...s,
        chainId: parseInt(chainIdHex, 16),
      }));
    };

    eth.on("accountsChanged", handleAccountsChanged);
    eth.on("chainChanged", handleChainChanged);

    return () => {
      eth.removeListener("accountsChanged", handleAccountsChanged);
      eth.removeListener("chainChanged", handleChainChanged);
    };
  }, [checkConnection]);

  const connect = useCallback(async () => {
    const eth =
      typeof window !== "undefined" ? (window as any).ethereum : null;

    if (!eth) {
      // Open MetaMask install page
      window.open("https://metamask.io/download/", "_blank");
      return;
    }

    setState((s) => ({ ...s, isConnecting: true, error: null }));

    try {
      const accounts: string[] = await eth.request({
        method: "eth_requestAccounts",
      });
      const chainIdHex: string = await eth.request({ method: "eth_chainId" });

      setState({
        address: accounts[0],
        chainId: parseInt(chainIdHex, 16),
        isConnecting: false,
        error: null,
        hasMetaMask: true,
      });
    } catch (e: any) {
      setState((s) => ({
        ...s,
        isConnecting: false,
        error: e.message ?? "Ошибка подключения кошелька",
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState((s) => ({
      ...s,
      address: null,
      chainId: null,
      error: null,
    }));
  }, []);

  return { ...state, connect, disconnect };
}
