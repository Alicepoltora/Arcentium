/**
 * Circle CCTP V2 — Cross-Chain Transfer Protocol
 *
 * Flow: approve → depositForBurn → poll attestation → receiveMessage
 *
 * Contracts (same address on ALL testnets):
 *   TokenMessengerV2:     0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA
 *   MessageTransmitterV2: 0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275
 *
 * CCTP Domain IDs (testnet):
 *   Ethereum Sepolia:  0
 *   Avalanche Fuji:    1
 *   OP Sepolia:        2
 *   Arbitrum Sepolia:  3
 *   Base Sepolia:      6
 *   Polygon Amoy:      7
 *   Arc Testnet:      26
 *
 * Attestation API (sandbox):
 *   GET https://iris-api-sandbox.circle.com/v1/messages/{domain}/{txHash}
 */

import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseUnits,
} from "viem";
import type { ChainConfig } from "./chains";

// ── Contract addresses ────────────────────────────────────────────────────────

export const CCTP_TOKEN_MESSENGER_V2 =
  "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA" as const;
export const CCTP_MESSAGE_TRANSMITTER_V2 =
  "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275" as const;

// ── CCTP Domain IDs ───────────────────────────────────────────────────────────

export const CCTP_DOMAINS: Record<string, number> = {
  Ethereum_Sepolia: 0,
  Avalanche_Fuji: 1,
  OP_Sepolia: 2,
  Arbitrum_Sepolia: 3,
  Base_Sepolia: 6,
  Polygon_PoS_Amoy: 7,
  Arc_Testnet: 26,
};

// ── ABIs ──────────────────────────────────────────────────────────────────────

export const ERC20_ABI = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

export const TOKEN_MESSENGER_V2_ABI = [
  {
    type: "function",
    name: "depositForBurn",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "destinationDomain", type: "uint32" },
      { name: "mintRecipient", type: "bytes32" },
      { name: "burnToken", type: "address" },
      { name: "destinationCaller", type: "bytes32" },
      { name: "maxFee", type: "uint256" },
      { name: "minFinalityThreshold", type: "uint32" },
    ],
    outputs: [{ name: "nonce", type: "uint64" }],
    stateMutability: "nonpayable",
  },
] as const;

export const MESSAGE_TRANSMITTER_V2_ABI = [
  {
    type: "function",
    name: "receiveMessage",
    inputs: [
      { name: "message", type: "bytes" },
      { name: "attestation", type: "bytes" },
    ],
    outputs: [{ name: "success", type: "bool" }],
    stateMutability: "nonpayable",
  },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Pad 20-byte EVM address to 32-byte hex (left-padded with zeros) */
export function addressToBytes32(address: string): `0x${string}` {
  const hex = address.toLowerCase().replace("0x", "");
  return `0x${"0".repeat(64 - hex.length)}${hex}` as `0x${string}`;
}

// ── Bridge step state ─────────────────────────────────────────────────────────

export type BridgeStep =
  | { status: "idle" }
  | { status: "approving" }
  | { status: "burning" }
  | { status: "burned"; txHash: string }
  | { status: "attesting"; txHash: string; progress: number }
  | { status: "minting"; txHash: string }
  | { status: "done"; burnTxHash: string; mintTxHash: string }
  | { status: "error"; message: string };

// ── Arc Testnet viem chain definition ─────────────────────────────────────────

const ARC_TESTNET_CHAIN = {
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
} as const;

// ── Main bridge function ──────────────────────────────────────────────────────

export interface BridgeParams {
  sourceChain: ChainConfig;
  amount: string; // e.g. "1.50"
  recipientAddress: string; // wallet address that will receive USDC on Arc
}

export async function bridgeToArc(
  params: BridgeParams,
  onStep: (step: BridgeStep) => void
): Promise<void> {
  const { sourceChain, amount, recipientAddress } = params;

  if (!sourceChain.chainId || !sourceChain.rpcUrl || !sourceChain.usdcAddress) {
    throw new Error(`${sourceChain.name} is not supported for bridging`);
  }

  const sourceDomain = CCTP_DOMAINS[sourceChain.id];
  if (sourceDomain === undefined) {
    throw new Error(`No CCTP domain found for ${sourceChain.name}`);
  }

  if (typeof window === "undefined") {
    throw new Error("Browser wallet not available");
  }

  const ethereum = (window as any).ethereum;
  if (!ethereum) {
    throw new Error("MetaMask not installed — install it at metamask.io");
  }

  // ── Switch wallet to source chain ─────────────────────────────────────────
  await switchChain(ethereum, sourceChain);

  // ── Build viem clients ────────────────────────────────────────────────────
  const sourceViemChain = {
    id: sourceChain.chainId,
    name: sourceChain.name,
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [sourceChain.rpcUrl] } },
  } as const;

  const publicClient = createPublicClient({
    chain: sourceViemChain,
    transport: http(sourceChain.rpcUrl, { timeout: 30000 }),
  });

  const walletClient = createWalletClient({
    chain: sourceViemChain,
    transport: custom(ethereum),
  });

  const [account] = await walletClient.getAddresses();
  const amountUnits = parseUnits(amount, 6);

  // ── Step 1: Approve TokenMessengerV2 to spend USDC ───────────────────────
  onStep({ status: "approving" });

  const approveTxHash = await walletClient.writeContract({
    address: sourceChain.usdcAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "approve",
    args: [CCTP_TOKEN_MESSENGER_V2, amountUnits],
    account,
    chain: sourceViemChain,
  });

  await publicClient.waitForTransactionReceipt({
    hash: approveTxHash,
    timeout: 60000,
  });

  // ── Step 2: depositForBurn on source chain ────────────────────────────────
  onStep({ status: "burning" });

  const mintRecipient = addressToBytes32(recipientAddress);
  const ZERO_BYTES32 =
    "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;

  const burnTxHash = await walletClient.writeContract({
    address: CCTP_TOKEN_MESSENGER_V2,
    abi: TOKEN_MESSENGER_V2_ABI,
    functionName: "depositForBurn",
    args: [
      amountUnits,
      26, // Arc Testnet CCTP domain
      mintRecipient,
      sourceChain.usdcAddress as `0x${string}`,
      ZERO_BYTES32, // any relayer can call receiveMessage
      BigInt(0), // maxFee — no cap
      0, // minFinalityThreshold — use default
    ],
    account,
    chain: sourceViemChain,
  });

  await publicClient.waitForTransactionReceipt({
    hash: burnTxHash,
    timeout: 120000,
  });

  onStep({ status: "burned", txHash: burnTxHash });

  // ── Step 3: Poll Circle attestation API ───────────────────────────────────
  onStep({ status: "attesting", txHash: burnTxHash, progress: 0 });

  let message: string | null = null;
  let attestation: string | null = null;
  let attempts = 0;

  while (!message || !attestation || attestation === "PENDING") {
    await sleep(5000);
    attempts++;

    onStep({
      status: "attesting",
      txHash: burnTxHash,
      progress: Math.min(90, attempts * 6),
    });

    try {
      const res = await fetch(
        `/api/attestation?domain=${sourceDomain}&txHash=${burnTxHash}`
      );
      if (res.ok) {
        const data = await res.json();
        const msg = data.messages?.[0];
        if (msg?.status === "complete" && msg.attestation !== "PENDING") {
          message = msg.message as string;
          attestation = msg.attestation as string;
        }
      }
    } catch {
      // Keep polling
    }

    if (attempts > 72) {
      // 72 * 5s = 6 minutes
      throw new Error("Attestation timeout — try again later");
    }
  }

  onStep({ status: "attesting", txHash: burnTxHash, progress: 100 });

  // ── Step 4: Switch to Arc Testnet + receiveMessage ────────────────────────
  onStep({ status: "minting", txHash: burnTxHash });

  await switchChain(ethereum, {
    chainId: 5042002,
    name: "Arc Testnet",
    rpcUrl: "https://rpc.testnet.arc.network",
    explorerUrl: "https://testnet.arcscan.app",
    nativeCurrencyName: "USDC",
    nativeCurrencySymbol: "USDC",
    nativeCurrencyDecimals: 6,
  });

  const arcWalletClient = createWalletClient({
    chain: ARC_TESTNET_CHAIN,
    transport: custom(ethereum),
  });

  const arcPublicClient = createPublicClient({
    chain: ARC_TESTNET_CHAIN,
    transport: http("https://rpc.testnet.arc.network", { timeout: 30000 }),
  });

  const mintTxHash = await arcWalletClient.writeContract({
    address: CCTP_MESSAGE_TRANSMITTER_V2,
    abi: MESSAGE_TRANSMITTER_V2_ABI,
    functionName: "receiveMessage",
    args: [message as `0x${string}`, attestation as `0x${string}`],
    account,
    chain: ARC_TESTNET_CHAIN,
  });

  await arcPublicClient.waitForTransactionReceipt({
    hash: mintTxHash,
    timeout: 60000,
  });

  onStep({ status: "done", burnTxHash, mintTxHash });
}

// ── Utility helpers ───────────────────────────────────────────────────────────

interface SwitchChainParams {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrencyName?: string;
  nativeCurrencySymbol?: string;
  nativeCurrencyDecimals?: number;
}

async function switchChain(
  ethereum: any,
  chain: SwitchChainParams | ChainConfig
): Promise<void> {
  const chainId =
    "chainId" in chain && typeof chain.chainId === "number"
      ? chain.chainId
      : undefined;

  if (!chainId) return;

  const rpcUrl =
    "rpcUrl" in chain && typeof chain.rpcUrl === "string"
      ? chain.rpcUrl
      : undefined;
  const explorerUrl =
    "explorerUrl" in chain ? chain.explorerUrl : "";
  const name = "name" in chain ? chain.name : "Unknown";

  const nativeCurrencyName =
    "nativeCurrencyName" in chain
      ? (chain as SwitchChainParams).nativeCurrencyName ?? "ETH"
      : "ETH";
  const nativeCurrencySymbol =
    "nativeCurrencySymbol" in chain
      ? (chain as SwitchChainParams).nativeCurrencySymbol ?? "ETH"
      : "ETH";
  const nativeCurrencyDecimals =
    "nativeCurrencyDecimals" in chain
      ? (chain as SwitchChainParams).nativeCurrencyDecimals ?? 18
      : 18;

  const chainIdHex = `0x${chainId.toString(16)}`;

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
  } catch (switchErr: any) {
    if (switchErr.code === 4902 && rpcUrl) {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: chainIdHex,
            chainName: name,
            nativeCurrency: {
              name: nativeCurrencyName,
              symbol: nativeCurrencySymbol,
              decimals: nativeCurrencyDecimals,
            },
            rpcUrls: [rpcUrl],
            blockExplorerUrls: explorerUrl ? [explorerUrl] : [],
          },
        ],
      });
    } else {
      throw switchErr;
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
