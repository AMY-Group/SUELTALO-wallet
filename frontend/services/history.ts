import { Connection, PublicKey, ParsedTransactionWithMeta, ConfirmedSignatureInfo } from '@solana/web3.js';
import { WalletService } from './WalletService';

export interface TransactionHistoryItem {
  signature: string;
  timestamp: number;
  status: 'confirmed' | 'finalized' | 'failed';
  type: 'send' | 'receive' | 'unknown';
  token: string;
  amount: number;
  counterparty: string;
  error?: string;
}

export class HistoryService {
  // Get recent transaction signatures
  static async getRecentSigs(address: string, limit: number = 20): Promise<ConfirmedSignatureInfo[]> {
    try {
      const connection = WalletService.getConnection();
      const publicKey = new PublicKey(address);

      const signatures = await connection.getSignaturesForAddress(publicKey, { limit });
      return signatures;
    } catch (error) {
      console.error('Get recent signatures error:', error);
      return [];
    }
  }

  // Get parsed transaction
  static async getParsedTx(signature: string): Promise<ParsedTransactionWithMeta | null> {
    try {
      const connection = WalletService.getConnection();
      const tx = await connection.getParsedTransaction(signature, { maxSupportedTransactionVersion: 0 });
      return tx;
    } catch (error) {
      console.error('Get parsed transaction error:', error);
      return null;
    }
  }

  // Parse transaction for display
  static async parseTransaction(
    sig: ConfirmedSignatureInfo,
    userAddress: string
  ): Promise<TransactionHistoryItem | null> {
    try {
      const tx = await this.getParsedTx(sig.signature);
      if (!tx) return null;

      const status = sig.confirmationStatus === 'finalized' ? 'finalized' : 'confirmed';
      const timestamp = sig.blockTime || 0;

      // Default values
      let type: 'send' | 'receive' | 'unknown' = 'unknown';
      let token = 'SOL';
      let amount = 0;
      let counterparty = '';

      // Parse instructions
      const instructions = tx.transaction.message.instructions;

      for (const instruction of instructions) {
        if ('parsed' in instruction) {
          const parsed = instruction.parsed;

          // SOL Transfer
          if (parsed.type === 'transfer') {
            const info = parsed.info;
            token = 'SOL';
            amount = info.lamports / 1e9;
            
            if (info.source === userAddress) {
              type = 'send';
              counterparty = info.destination;
            } else if (info.destination === userAddress) {
              type = 'receive';
              counterparty = info.source;
            }
            break;
          }

          // SPL Token Transfer
          if (parsed.type === 'transferChecked' || parsed.type === 'transfer') {
            const info = parsed.info;
            
            // Determine token type from mint (simplified)
            if (info.mint) {
              token = 'TOKEN';
            }

            if (info.amount) {
              amount = parseFloat(info.amount) / Math.pow(10, info.decimals || 0);
            }

            if (info.source) {
              const sourceOwner = info.authority || info.source;
              if (sourceOwner === userAddress) {
                type = 'send';
                counterparty = info.destination;
              } else {
                type = 'receive';
                counterparty = info.source;
              }
            }
            break;
          }
        }
      }

      return {
        signature: sig.signature,
        timestamp,
        status: sig.err ? 'failed' : status,
        type,
        token,
        amount,
        counterparty,
        error: sig.err ? JSON.stringify(sig.err) : undefined,
      };
    } catch (error) {
      console.error('Parse transaction error:', error);
      return null;
    }
  }

  // Get transaction history with parsed data
  static async getTransactionHistory(
    address: string,
    limit: number = 20
  ): Promise<TransactionHistoryItem[]> {
    try {
      const signatures = await this.getRecentSigs(address, limit);
      const history: TransactionHistoryItem[] = [];

      for (const sig of signatures) {
        const item = await this.parseTransaction(sig, address);
        if (item) {
          history.push(item);
        }
      }

      return history;
    } catch (error) {
      console.error('Get transaction history error:', error);
      return [];
    }
  }

  // Get Solana Explorer URL (Devnet)
  static getExplorerUrl(signature: string, cluster: string = 'devnet'): string {
    return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
  }
}
