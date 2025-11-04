import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
  Keypair,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { WalletService } from './WalletService';
import Constants from 'expo-constants';

export interface SendSOLParams {
  to: string;
  lamports: number;
}

export interface SendSPLParams {
  mint: string;
  decimals: number;
  to: string;
  amount: number;
}

export interface TransactionResult {
  signature: string;
  success: boolean;
  error?: string;
}

export class TokenService {
  // Get SPL Token mints from env
  static getSLTMint(): string {
    return Constants.expoConfig?.extra?.EXPO_PUBLIC_SLT_MINT || 
           process.env.EXPO_PUBLIC_SLT_MINT ||
           '';
  }

  static getUSDCMockMint(): string {
    return Constants.expoConfig?.extra?.EXPO_PUBLIC_USDC_MINT || 
           process.env.EXPO_PUBLIC_USDC_MINT ||
           '';
  }

  // Send SOL
  static async sendSOL(params: SendSOLParams): Promise<TransactionResult> {
    try {
      const connection = WalletService.getConnection();
      const keypair = await WalletService.getKeypair();
      
      if (!keypair) {
        throw new Error('No wallet found');
      }

      const toPublicKey = new PublicKey(params.to);

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey: toPublicKey,
          lamports: params.lamports,
        })
      );

      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [keypair],
        { commitment: 'confirmed' }
      );

      return {
        signature,
        success: true,
      };
    } catch (error: any) {
      console.error('Send SOL error:', error);
      return {
        signature: '',
        success: false,
        error: error.message || 'Failed to send SOL',
      };
    }
  }

  // Get or Create Associated Token Account
  static async getOrCreateATA(
    mint: string,
    owner: string,
    payer: Keypair
  ): Promise<PublicKey> {
    try {
      const connection = WalletService.getConnection();
      const mintPublicKey = new PublicKey(mint);
      const ownerPublicKey = new PublicKey(owner);

      const ata = await getAssociatedTokenAddress(
        mintPublicKey,
        ownerPublicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // Check if ATA exists
      const accountInfo = await connection.getAccountInfo(ata);

      if (!accountInfo) {
        // Create ATA
        const transaction = new Transaction().add(
          createAssociatedTokenAccountInstruction(
            payer.publicKey,
            ata,
            ownerPublicKey,
            mintPublicKey,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );

        await sendAndConfirmTransaction(connection, transaction, [payer], {
          commitment: 'confirmed',
        });

        console.log(`Created ATA for ${owner}: ${ata.toString()}`);
      }

      return ata;
    } catch (error) {
      console.error('Get or Create ATA error:', error);
      throw error;
    }
  }

  // Send SPL Token
  static async sendSPL(params: SendSPLParams): Promise<TransactionResult> {
    try {
      const connection = WalletService.getConnection();
      const keypair = await WalletService.getKeypair();
      
      if (!keypair) {
        throw new Error('No wallet found');
      }

      const mintPublicKey = new PublicKey(params.mint);
      const toPublicKey = new PublicKey(params.to);

      // Get source ATA
      const fromATA = await getAssociatedTokenAddress(
        mintPublicKey,
        keypair.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // Get or create destination ATA
      const toATA = await this.getOrCreateATA(params.mint, params.to, keypair);

      // Calculate amount with decimals
      const amount = Math.floor(params.amount * Math.pow(10, params.decimals));

      const transaction = new Transaction().add(
        createTransferInstruction(
          fromATA,
          toATA,
          keypair.publicKey,
          amount,
          [],
          TOKEN_PROGRAM_ID
        )
      );

      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [keypair],
        { commitment: 'confirmed' }
      );

      return {
        signature,
        success: true,
      };
    } catch (error: any) {
      console.error('Send SPL error:', error);
      
      // Handle common errors
      let errorMessage = error.message || 'Failed to send token';
      
      if (errorMessage.includes('insufficient funds')) {
        errorMessage = 'Fondos insuficientes para completar la transacción';
      } else if (errorMessage.includes('invalid public key')) {
        errorMessage = 'Dirección de destino inválida';
      } else if (errorMessage.includes('could not find account')) {
        errorMessage = 'Cuenta de token no encontrada. ¿Tienes saldo de este token?';
      }

      return {
        signature: '',
        success: false,
        error: errorMessage,
      };
    }
  }

  // Request SOL airdrop from Devnet faucet
  static async requestAirdrop(address: string, solAmount: number = 1): Promise<TransactionResult> {
    try {
      const connection = WalletService.getConnection();
      const publicKey = new PublicKey(address);
      const lamports = solAmount * LAMPORTS_PER_SOL;

      const signature = await connection.requestAirdrop(publicKey, lamports);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      return {
        signature,
        success: true,
      };
    } catch (error: any) {
      console.error('Airdrop error:', error);
      return {
        signature: '',
        success: false,
        error: error.message || 'Failed to request airdrop',
      };
    }
  }

  // Get token balance
  static async getTokenBalance(address: string, mint: string): Promise<number> {
    try {
      const connection = WalletService.getConnection();
      const publicKey = new PublicKey(address);
      const mintPublicKey = new PublicKey(mint);

      const ata = await getAssociatedTokenAddress(
        mintPublicKey,
        publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const balance = await connection.getTokenAccountBalance(ata);
      return parseFloat(balance.value.uiAmount?.toString() || '0');
    } catch (error) {
      console.error('Get token balance error:', error);
      return 0;
    }
  }

  // Get SOL balance
  static async getSOLBalance(address: string): Promise<number> {
    try {
      const connection = WalletService.getConnection();
      const publicKey = new PublicKey(address);
      const balance = await connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Get SOL balance error:', error);
      return 0;
    }
  }
}
