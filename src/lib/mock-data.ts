// Demo-данные для работы без приватных ключей
// Реалистичные балансы USDC на разных чейнах testnet

import type { BalancesResponse, Transaction } from "./types";

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
    },
    {
      chainId: "Base_Sepolia",
      chainName: "Base Sepolia",
      confirmedBalance: "3.00",
      pendingBalance: "0.75",
      depositorAddress: "0x1234...abcd",
    },
    {
      chainId: "Arbitrum_Sepolia",
      chainName: "Arbitrum Sepolia",
      confirmedBalance: "1.25",
      pendingBalance: "0.00",
      depositorAddress: "0x1234...abcd",
    },
    {
      chainId: "OP_Sepolia",
      chainName: "Optimism Sepolia",
      confirmedBalance: "0.52",
      pendingBalance: "0.00",
      depositorAddress: "0x1234...abcd",
    },
    {
      chainId: "Polygon_PoS_Amoy",
      chainName: "Polygon Amoy",
      confirmedBalance: "0.80",
      pendingBalance: "0.00",
      depositorAddress: "0x1234...abcd",
    },
    {
      chainId: "Avalanche_Fuji",
      chainName: "Avalanche Fuji",
      confirmedBalance: "0.30",
      pendingBalance: "0.00",
      depositorAddress: "0x1234...abcd",
    },
    {
      chainId: "Solana_Devnet",
      chainName: "Solana Devnet",
      confirmedBalance: "0.50",
      pendingBalance: "0.00",
      depositorAddress: "FakeSOL...devnet",
    },
    {
      chainId: "Arc_Testnet",
      chainName: "Arc Testnet",
      confirmedBalance: "5.00",
      pendingBalance: "0.00",
      depositorAddress: "0x1234...abcd",
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
