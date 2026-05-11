// Конфигурация блокчейнов, поддерживаемых App Kit Unified Balance
// Chain ID strings соответствуют документации Arc App Kit

export type NetworkType = "testnet" | "mainnet";

export interface ChainConfig {
  /** ID чейна */
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
  /** Public RPC URL для чтения баланса через viem (только EVM) */
  rpcUrl?: string;
  /** Адрес USDC-контракта на этом чейне */
  usdcAddress?: string;
  /** Chain ID в числовом виде (для viem) */
  chainId?: number;
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
    chainId: 11155111,
    rpcUrl: "https://rpc.sepolia.org",
    usdcAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  },
  {
    id: "Base_Sepolia",
    name: "Base Sepolia",
    shortName: "Base",
    color: "#0052FF",
    icon: "⬟",
    explorerUrl: "https://sepolia.basescan.org",
    supportsUnifiedBalance: true,
    chainId: 84532,
    rpcUrl: "https://sepolia.base.org",
    usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  },
  {
    id: "Arbitrum_Sepolia",
    name: "Arbitrum Sepolia",
    shortName: "Arbitrum",
    color: "#12AAFF",
    icon: "◈",
    explorerUrl: "https://sepolia.arbiscan.io",
    supportsUnifiedBalance: true,
    chainId: 421614,
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    usdcAddress: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
  },
  {
    id: "OP_Sepolia",
    name: "Optimism Sepolia",
    shortName: "Optimism",
    color: "#FF0420",
    icon: "⊙",
    explorerUrl: "https://sepolia-optimism.etherscan.io",
    supportsUnifiedBalance: true,
    chainId: 11155420,
    rpcUrl: "https://sepolia.optimism.io",
    usdcAddress: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
  },
  {
    id: "Polygon_PoS_Amoy",
    name: "Polygon Amoy",
    shortName: "Polygon",
    color: "#8247E5",
    icon: "⬡",
    explorerUrl: "https://amoy.polygonscan.com",
    supportsUnifiedBalance: true,
    chainId: 80002,
    rpcUrl: "https://rpc-amoy.polygon.technology",
    usdcAddress: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
  },
  {
    id: "Avalanche_Fuji",
    name: "Avalanche Fuji",
    shortName: "Avalanche",
    color: "#E84142",
    icon: "△",
    explorerUrl: "https://testnet.snowtrace.io",
    supportsUnifiedBalance: true,
    chainId: 43113,
    rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
    usdcAddress: "0x5425890298aed601595a70AB815c96711a31Bc65",
  },
  {
    id: "Solana_Devnet",
    name: "Solana Devnet",
    shortName: "Solana",
    color: "#9945FF",
    icon: "◎",
    explorerUrl: "https://explorer.solana.com/?cluster=devnet",
    supportsUnifiedBalance: true,
    // Solana uses SPL tokens — не читается через viem, баланс приходит из демо-данных
  },
  {
    id: "Unichain_Sepolia",
    name: "Unichain Sepolia",
    shortName: "Unichain",
    color: "#FF007A",
    icon: "◉",
    explorerUrl: "https://unichain-sepolia.blockscout.com",
    supportsUnifiedBalance: true,
    chainId: 1301,
    rpcUrl: "https://sepolia.unichain.org",
    usdcAddress: "0x31d0220469e10c4E71834a79b1f276d740d3768F",
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
    chainId: 5042002,
    rpcUrl: "https://rpc.testnet.arc.network",
    usdcAddress: "0x3600000000000000000000000000000000000000",
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
