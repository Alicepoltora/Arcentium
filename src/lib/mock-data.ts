// Demo-данные для работы без приватных ключей
// Реалистичные балансы ETH + USDC на разных чейнах testnet

import type { BalancesResponse, TokenBalance, Transaction } from "./types";

function ethAndUsdc(eth: string, usdc: string, usdcAddr: string): TokenBalance[] {
  return [
    { symbol: "ETH", balance: eth, decimals: 18 },
    { symbol: "USDC", balance: usdc, decimals: 6, contractAddress: usdcAddr },
  ];
}

export const MOCK_BALANCES: BalancesResponse = {
  isDemo: true,
  networkType: "testnet",
  token: "USDC",
  totalConfirmed: "8.47",
  totalPending: "0.75",
  fetchedAt: new Date().toISOString(),
  chains: [
    {
      chainId: "Ethereum_Sepolia",
      chainName: "Ethereum Sepolia",
      confirmedBalance: "2.10",
      pendingBalance: "0.00",
      depositorAddress: "0x1234...abcd",
      tokens: ethAndUsdc("0.0821", "2.10", "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"),
    },
    {
      chainId: "Base_Sepolia",
      chainName: "Base Sepolia",
      confirmedBalance: "3.00",
      pendingBalance: "0.75",
      depositorAddress: "0x1234...abcd",
      tokens: ethAndUsdc("0.1250", "3.00", "0x036CbD53842c5426634e7929541eC2318f3dCF7e"),
    },
    {
      chainId: "Arbitrum_Sepolia",
      chainName: "Arbitrum Sepolia",
      confirmedBalance: "1.25",
      pendingBalance: "0.00",
      depositorAddress: "0x1234...abcd",
      tokens: ethAndUsdc("0.0200", "1.25", "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"),
    },
    {
      chainId: "OP_Sepolia",
      chainName: "Optimism Sepolia",
      confirmedBalance: "0.52",
      pendingBalance: "0.00",
      depositorAddress: "0x1234...abcd",
      tokens: ethAndUsdc("0.0150", "0.52", "0x5fd84259d66Cd46123540766Be93DFE6D43130D7"),
    },
    {
      chainId: "Polygon_PoS_Amoy",
      chainName: "Polygon Amoy",
      confirmedBalance: "0.80",
      pendingBalance: "0.00",
      depositorAddress: "0x1234...abcd",
      tokens: [
        { symbol: "POL", balance: "12.500", decimals: 18 },
        { symbol: "USDC", balance: "0.80", decimals: 6, contractAddress: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582" },
      ],
    },
    {
      chainId: "Avalanche_Fuji",
      chainName: "Avalanche Fuji",
      confirmedBalance: "0.30",
      pendingBalance: "0.00",
      depositorAddress: "0x1234...abcd",
      tokens: [
        { symbol: "AVAX", balance: "0.4200", decimals: 18 },
        { symbol: "USDC", balance: "0.30", decimals: 6, contractAddress: "0x5425890298aed601595a70AB815c96711a31Bc65" },
      ],
    },
    {
      chainId: "Solana_Devnet",
      chainName: "Solana Devnet",
      confirmedBalance: "0.50",
      pendingBalance: "0.00",
      depositorAddress: "FakeSOL...devnet",
      tokens: [
        { symbol: "SOL", balance: "0.1500", decimals: 9 },
        { symbol: "USDC", balance: "0.50", decimals: 6 },
      ],
    },
    {
      chainId: "Arc_Testnet",
      chainName: "Arc Testnet",
      confirmedBalance: "5.00",
      pendingBalance: "0.00",
      depositorAddress: "0x1234...abcd",
      tokens: [
        { symbol: "USDC", balance: "5.00", decimals: 6, contractAddress: "0x3600000000000000000000000000000000000000" },
      ],
    },
  ],
};

// Пример истории транзакций
export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-001",
    type: "deposit",
    chainId: "Base_Sepolia",
    amount: "3.00",
    token: "USDC",
    txHash: "0x3f5a...b291",
    explorerUrl: "https://sepolia.basescan.org/tx/0x3f5a",
    status: "confirmed",
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 min ago
  },
  {
    id: "tx-002",
    type: "deposit",
    chainId: "Arbitrum_Sepolia",
    amount: "1.25",
    token: "USDC",
    txHash: "0x8a2c...e741",
    explorerUrl: "https://sepolia.arbiscan.io/tx/0x8a2c",
    status: "confirmed",
    timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(), // 18 min ago
  },
  {
    id: "tx-003",
    type: "deposit",
    chainId: "Ethereum_Sepolia",
    amount: "2.10",
    token: "USDC",
    txHash: "0xd91f...4c82",
    explorerUrl: "https://sepolia.etherscan.io/tx/0xd91f",
    status: "confirmed",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
  },
  {
    id: "tx-004",
    type: "deposit",
    chainId: "Base_Sepolia",
    amount: "0.75",
    token: "USDC",
    status: "pending",
    timestamp: new Date(Date.now() - 30 * 1000).toISOString(), // 30s ago
  },
  {
    id: "tx-005",
    type: "spend",
    chainId: "Arc_Testnet",
    targetChainId: "Arc_Testnet",
    amount: "5.00",
    token: "USDC",
    txHash: "0xc31b...9a05",
    explorerUrl: "https://testnet.arcscan.app/tx/0xc31b",
    status: "confirmed",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1d ago
  },
];

// Генерируем фейковые транзакции для demo-консолидации
export function generateMockConsolidationTxs(
  sourceChains: string[],
  targetChainId: string,
  totalAmount: string
): Transaction[] {
  const txs: Transaction[] = sourceChains.map((chainId, i) => ({
    id: `mock-${Date.now()}-${i}`,
    type: "deposit" as const,
    chainId,
    amount: (parseFloat(totalAmount) / sourceChains.length).toFixed(2),
    token: "USDC" as const,
    txHash: `0x${Math.random().toString(16).slice(2, 10)}...`,
    status: "confirmed" as const,
    timestamp: new Date().toISOString(),
  }));

  txs.push({
    id: `mock-${Date.now()}-spend`,
    type: "spend",
    chainId: targetChainId,
    targetChainId,
    amount: totalAmount,
    token: "USDC",
    txHash: `0x${Math.random().toString(16).slice(2, 10)}...`,
    explorerUrl: `https://testnet.arcscan.app/tx/0x${Math.random()
      .toString(16)
      .slice(2, 10)}`,
    status: "confirmed",
    timestamp: new Date().toISOString(),
  });

  return txs;
}
