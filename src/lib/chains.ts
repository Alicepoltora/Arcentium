// Конфигурация блокчейнов, поддерживаемых App Kit Unified Balance
// Chain ID strings соответствуют документации Arc App Kit

export type NetworkType = "testnet" | "mainnet";

export interface ChainConfig {
  /** ID чейна в App Kit SDK */
  id: string;
  /** Человекочитаемое название */
  name: string;
  shortName: string;
  /** Hex цвет для акцентов */
  color: string;
  /** Иконка (символ или emoji) */
  icon: string;
  /** Ссылка на блок-эксплорер */
  explorerUrl: string;
  /** Поддерживает Unified Balance */
  supportsUnifiedBalance: boolean;
  /** Это основной чейн для консолидации (Arc) */
  isPrimary?: boolean;
}

// ── Testnet chains ──────────────────────────────────────────────────────────

export const TESTNET_CHAINS: ChainConfig[] = [
  {
    id: "Ethereum_Sepolia",
    name: "Ethereum Sepolia",
    shortName: "Ethereum",
    color: "#627EEA",
    icon: "Ξ",
    explorerUrl: "https://sepolia.etherscan.io",
    supportsUnifiedBalance: true,
  },
  {
    id: "Base_Sepolia",
    name: "Base Sepolia",
    shortName: "Base",
    color: "#0052FF",
    icon: "⬟",
    explorerUrl: "https://sepolia.basescan.org",
    supportsUnifiedBalance: true,
  },
  {
    id: "Arbitrum_Sepolia",
    name: "Arbitrum Sepolia",
    shortName: "Arbitrum",
    color: "#12AAFF",
    icon: "◈",
    explorerUrl: "https://sepolia.arbiscan.io",
    supportsUnifiedBalance: true,
  },
  {
    id: "OP_Sepolia",
    name: "Optimism Sepolia",
    shortName: "Optimism",
    color: "#FF0420",
    icon: "⊙",
    explorerUrl: "https://sepolia-optimism.etherscan.io",
    supportsUnifiedBalance: true,
  },
  {
    id: "Polygon_PoS_Amoy",
    name: "Polygon Amoy",
    shortName: "Polygon",
    color: "#8247E5",
    icon: "⬡",
    explorerUrl: "https://amoy.polygonscan.com",
    supportsUnifiedBalance: true,
  },
  {
    id: "Avalanche_Fuji",
    name: "Avalanche Fuji",
    shortName: "Avalanche",
    color: "#E84142",
    icon: "△",
    explorerUrl: "https://testnet.snowtrace.io",
    supportsUnifiedBalance: true,
  },
  {
    id: "Solana_Devnet",
    name: "Solana Devnet",
    shortName: "Solana",
    color: "#9945FF",
    icon: "◎",
    explorerUrl: "https://explorer.solana.com/?cluster=devnet",
    supportsUnifiedBalance: true,
  },
  {
    id: "Unichain_Sepolia",
    name: "Unichain Sepolia",
    shortName: "Unichain",
    color: "#FF007A",
    icon: "◉",
    explorerUrl: "https://unichain-sepolia.blockscout.com",
    supportsUnifiedBalance: true,
  },
  {
    id: "Arc_Testnet",
    name: "Arc Testnet",
    shortName: "Arc",
    color: "#3E74BB",
    icon: "⚡",
    explorerUrl: "https://testnet.arcscan.app",
    supportsUnifiedBalance: true,
    isPrimary: true,
  },
];

// ── Mainnet chains ──────────────────────────────────────────────────────────

export const MAINNET_CHAINS: ChainConfig[] = [
  {
    id: "Ethereum",
    name: "Ethereum",
    shortName: "Ethereum",
    color: "#627EEA",
    icon: "Ξ",
    explorerUrl: "https://etherscan.io",
    supportsUnifiedBalance: true,
  },
  {
    id: "Base",
    name: "Base",
    shortName: "Base",
    color: "#0052FF",
    icon: "⬟",
    explorerUrl: "https://basescan.org",
    supportsUnifiedBalance: true,
  },
  {
    id: "Arbitrum",
    name: "Arbitrum",
    shortName: "Arbitrum",
    color: "#12AAFF",
    icon: "◈",
    explorerUrl: "https://arbiscan.io",
    supportsUnifiedBalance: true,
  },
  {
    id: "OP_Mainnet",
    name: "Optimism",
    shortName: "Optimism",
    color: "#FF0420",
    icon: "⊙",
    explorerUrl: "https://optimistic.etherscan.io",
    supportsUnifiedBalance: true,
  },
  {
    id: "Polygon_PoS",
    name: "Polygon",
    shortName: "Polygon",
    color: "#8247E5",
    icon: "⬡",
    explorerUrl: "https://polygonscan.com",
    supportsUnifiedBalance: true,
  },
  {
    id: "Avalanche",
    name: "Avalanche",
    shortName: "Avalanche",
    color: "#E84142",
    icon: "△",
    explorerUrl: "https://snowtrace.io",
    supportsUnifiedBalance: true,
  },
  {
    id: "Solana",
    name: "Solana",
    shortName: "Solana",
    color: "#9945FF",
    icon: "◎",
    explorerUrl: "https://explorer.solana.com",
    supportsUnifiedBalance: true,
  },
  {
    id: "Unichain",
    name: "Unichain",
    shortName: "Unichain",
    color: "#FF007A",
    icon: "◉",
    explorerUrl: "https://unichain.blockscout.com",
    supportsUnifiedBalance: true,
  },
  {
    id: "World_Chain",
    name: "World Chain",
    shortName: "World",
    color: "#00A86B",
    icon: "🌐",
    explorerUrl: "https://worldchain-mainnet.explorer.alchemy.com",
    supportsUnifiedBalance: true,
  },
  {
    id: "Sonic",
    name: "Sonic",
    shortName: "Sonic",
    color: "#00CFFF",
    icon: "⟫",
    explorerUrl: "https://sonicscan.org",
    supportsUnifiedBalance: true,
  },
];

export function getChains(network: NetworkType): ChainConfig[] {
  return network === "testnet" ? TESTNET_CHAINS : MAINNET_CHAINS;
}

export function getChainById(
  id: string,
  network: NetworkType
): ChainConfig | undefined {
  return getChains(network).find((c) => c.id === id);
}

export function getPrimaryChain(network: NetworkType): ChainConfig {
  const chains = getChains(network);
  return chains.find((c) => c.isPrimary) ?? chains[chains.length - 1];
}
