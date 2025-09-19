import { Keypair, PublicKey } from '@solana/web3.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as bip39 from 'react-native-bip39';

export interface WalletData {
  keypair: Keypair;
  mnemonic: string;
  publicKey: string;
}

export class WalletService {
  private static readonly WALLET_KEY = '@wallet_data';
  private static readonly SEED_PHRASE_KEY = '@secure_seed_phrase';

  static async generateNewWallet(): Promise<WalletData> {
    try {
      // Generate mnemonic phrase
      const mnemonic = bip39.generateMnemonic();
      
      // Create seed from mnemonic
      const seed = await bip39.mnemonicToSeed(mnemonic);
      
      // Generate keypair from seed (using first 32 bytes)
      const keypair = Keypair.fromSeed(seed.slice(0, 32));
      
      const walletData = {
        mnemonic,
        publicKey: keypair.publicKey.toString(),
        secretKey: Array.from(keypair.secretKey),
      };
      
      // Store wallet data
      await AsyncStorage.setItem(this.WALLET_KEY, JSON.stringify(walletData));
      
      // Store mnemonic securely
      await SecureStore.setItemAsync(this.SEED_PHRASE_KEY, mnemonic);
      
      return {
        keypair,
        mnemonic,
        publicKey: keypair.publicKey.toString(),
      };
    } catch (error) {
      console.error('Wallet generation error:', error);
      throw new Error(`Wallet generation failed: ${error}`);
    }
  }

  static async restoreWalletFromMnemonic(mnemonic: string): Promise<WalletData> {
    try {
      // Validate mnemonic
      if (!bip39.validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
      }
      
      // Create seed from mnemonic
      const seed = await bip39.mnemonicToSeed(mnemonic);
      
      // Generate keypair from seed
      const keypair = Keypair.fromSeed(seed.slice(0, 32));
      
      const walletData = {
        mnemonic,
        publicKey: keypair.publicKey.toString(),
        secretKey: Array.from(keypair.secretKey),
      };
      
      // Store wallet data
      await AsyncStorage.setItem(this.WALLET_KEY, JSON.stringify(walletData));
      
      // Store mnemonic securely
      await SecureStore.setItemAsync(this.SEED_PHRASE_KEY, mnemonic);
      
      return {
        keypair,
        mnemonic,
        publicKey: keypair.publicKey.toString(),
      };
    } catch (error) {
      console.error('Wallet restoration error:', error);
      throw new Error(`Wallet restoration failed: ${error}`);
    }
  }

  static async loadStoredWallet(): Promise<Keypair | null> {
    try {
      const storedData = await AsyncStorage.getItem(this.WALLET_KEY);
      if (!storedData) return null;
      
      const walletData = JSON.parse(storedData);
      const secretKey = new Uint8Array(walletData.secretKey);
      
      return Keypair.fromSecretKey(secretKey);
    } catch (error) {
      console.error('Failed to load stored wallet:', error);
      return null;
    }
  }

  static async getStoredWalletData(): Promise<any | null> {
    try {
      const storedData = await AsyncStorage.getItem(this.WALLET_KEY);
      return storedData ? JSON.parse(storedData) : null;
    } catch (error) {
      console.error('Failed to get wallet data:', error);
      return null;
    }
  }

  static async clearWallet(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.WALLET_KEY);
      await SecureStore.deleteItemAsync(this.SEED_PHRASE_KEY);
    } catch (error) {
      console.error('Failed to clear wallet:', error);
      throw error;
    }
  }

  static validatePublicKey(publicKey: string): boolean {
    try {
      new PublicKey(publicKey);
      return true;
    } catch {
      return false;
    }
  }

  static async getSeedPhrase(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.SEED_PHRASE_KEY);
    } catch (error) {
      console.error('Failed to get seed phrase:', error);
      return null;
    }
  }
}