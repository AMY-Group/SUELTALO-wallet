import { Keypair, PublicKey, Connection, clusterApiUrl } from '@solana/web3.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import Constants from 'expo-constants';

export interface WalletData {
  keypair: Keypair;
  mnemonic: string;
  publicKey: string;
}

export class WalletService {
  private static readonly WALLET_KEY = '@wallet_data';
  private static readonly SEED_PHRASE_KEY = '@secure_seed_phrase';
  private static readonly LOCK_FLAG_KEY = '@wallet_locked';
  private static connection: Connection | null = null;

  // Get Solana Connection
  static getConnection(): Connection {
    if (!this.connection) {
      const rpcUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SOLANA_RPC || 
                     process.env.EXPO_PUBLIC_SOLANA_RPC ||
                     'https://api.devnet.solana.com';
      this.connection = new Connection(rpcUrl, 'confirmed');
    }
    return this.connection;
  }

  // Cross-platform secure storage helpers
  private static async setSecureItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  }

  private static async getSecureItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  }

  private static async deleteSecureItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  }

  // Generate BIP39 mnemonic (12 words, 128 bits entropy)
  static generateMnemonic(): string {
    return bip39.generateMnemonic(128);
  }

  // Validate BIP39 mnemonic
  static validateMnemonic(mnemonic: string): boolean {
    return bip39.validateMnemonic(mnemonic.trim());
  }

  // Derive Keypair from mnemonic using BIP44 path for Solana
  private static mnemonicToKeypair(mnemonic: string, accountIndex: number = 0): Keypair {
    // BIP44 path for Solana: m/44'/501'/0'/0'
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const path = `m/44'/501'/${accountIndex}'/0'`;
    const derivedSeed = derivePath(path, seed.toString('hex')).key;
    return Keypair.fromSeed(derivedSeed);
  }

  // Generate new wallet with BIP39/BIP44
  static async generateNewWallet(): Promise<WalletData> {
    try {
      const mnemonic = this.generateMnemonic();
      const keypair = this.mnemonicToKeypair(mnemonic);
      
      const walletData = {
        mnemonic,
        publicKey: keypair.publicKey.toString(),
        secretKey: Array.from(keypair.secretKey),
      };
      
      // Store wallet data in AsyncStorage
      await AsyncStorage.setItem(this.WALLET_KEY, JSON.stringify(walletData));
      
      // Store mnemonic securely
      await this.setSecureItem(this.SEED_PHRASE_KEY, mnemonic);
      
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

  // Import wallet from mnemonic
  static async importFromMnemonic(mnemonic: string): Promise<WalletData> {
    try {
      if (!this.validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
      }
      
      const keypair = this.mnemonicToKeypair(mnemonic);
      
      const walletData = {
        mnemonic,
        publicKey: keypair.publicKey.toString(),
        secretKey: Array.from(keypair.secretKey),
      };
      
      await AsyncStorage.setItem(this.WALLET_KEY, JSON.stringify(walletData));
      await this.setSecureItem(this.SEED_PHRASE_KEY, mnemonic);
      
      return {
        keypair,
        mnemonic,
        publicKey: keypair.publicKey.toString(),
      };
    } catch (error) {
      console.error('Wallet import error:', error);
      throw new Error(`Wallet import failed: ${error}`);
    }
  }

  // Get stored keypair
  static async getKeypair(): Promise<Keypair | null> {
    try {
      const storedData = await AsyncStorage.getItem(this.WALLET_KEY);
      if (!storedData) return null;
      
      const walletData = JSON.parse(storedData);
      const secretKey = new Uint8Array(walletData.secretKey);
      
      return Keypair.fromSecretKey(secretKey);
    } catch (error) {
      console.error('Failed to load keypair:', error);
      return null;
    }
  }

  // Get public key
  static async getPublicKey(): Promise<PublicKey | null> {
    const keypair = await this.getKeypair();
    return keypair ? keypair.publicKey : null;
  }

  // Get address string
  static async getAddress(): Promise<string | null> {
    const publicKey = await this.getPublicKey();
    return publicKey ? publicKey.toString() : null;
  }

  // Get stored wallet data
  static async getStoredWalletData(): Promise<any | null> {
    try {
      const storedData = await AsyncStorage.getItem(this.WALLET_KEY);
      return storedData ? JSON.parse(storedData) : null;
    } catch (error) {
      console.error('Failed to get wallet data:', error);
      return null;
    }
  }

  // Get seed phrase
  static async getSeedPhrase(): Promise<string | null> {
    try {
      return await this.getSecureItem(this.SEED_PHRASE_KEY);
    } catch (error) {
      console.error('Failed to get seed phrase:', error);
      return null;
    }
  }

  // Clear wallet
  static async clearWallet(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.WALLET_KEY);
      await this.deleteSecureItem(this.SEED_PHRASE_KEY);
      await AsyncStorage.removeItem(this.LOCK_FLAG_KEY);
    } catch (error) {
      console.error('Failed to clear wallet:', error);
      throw error;
    }
  }

  // Validate public key
  static validatePublicKey(publicKey: string): boolean {
    try {
      new PublicKey(publicKey);
      return true;
    } catch {
      return false;
    }
  }

  // Lock state management
  static async setLocked(locked: boolean): Promise<void> {
    await AsyncStorage.setItem(this.LOCK_FLAG_KEY, JSON.stringify(locked));
  }

  static async isLocked(): Promise<boolean> {
    const flag = await AsyncStorage.getItem(this.LOCK_FLAG_KEY);
    return flag ? JSON.parse(flag) : false;
  }

  // Legacy compatibility
  static async loadStoredWallet(): Promise<Keypair | null> {
    return this.getKeypair();
  }

  static async restoreWalletFromMnemonic(mnemonic: string): Promise<WalletData> {
    return this.importFromMnemonic(mnemonic);
  }
}