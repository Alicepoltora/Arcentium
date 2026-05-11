// Общие типы, используемые и на клиенте, и на сервере

export interface ChainBalance {
  chainId: string;
  chainName: string;
  confirmedBalance: string;
  pendingBalance: string;
  depositorAddress?: string;
}

export interface BalancesResponse {
  /** true — работаем с моковыми данными (нет приватных ключей) */
  isDemo: boolean;
  networkType: "testnet" | "mainnet";
  token: "USDC";
  totalConfirmed: string;
  totalPending: string;
  chains: ChainBalance[];
  fetchedAt: string;
}

export type TxStatus = "pending" | "confirmed" | "failed";

export interface Transaction {
  id: string;
  type: "deposit" | "spend";
  chainId: string;
  amount: string;
  token: "USDC";
  txHash?: string;
  explorerUrl?: string;
  status: TxStatus;
  timestamp: string;
  /** Для spend — целевой чейн */
  targetChainId?: string;
}

export interface ConsolidateRequest {
  /** Чейны-источники (по chainId) */
  sourceChains: string[];
  /** Целевой чейн */
  targetChainId: string;
  /** Адрес получателя */
  recipientAddress: string;
  /** Сумма USDC (строка, например "4.50") */
  amount: string;
}

export interface ConsolidateProgress {
  step: "depositing" | "spending" | "done" | "error";
  /** Описание текущего шага */
  message: string;
  /** Транзакции, выполненные до сих пор */
  transactions: Transaction[];
  error?: string;
}

export interface ConsolidateResponse {
  success: boolean;
  transactions: Transaction[];
  error?: string;
}
