import { Keypair, PublicKey } from '@solana/web3.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export interface WalletData {
  keypair: Keypair;
  mnemonic: string;
  publicKey: string;
}

// Simple word list for mnemonic generation (subset of BIP39)
const WORD_LIST = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse',
  'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act',
  'action', 'actor', 'actress', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admit',
  'adult', 'advance', 'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'against', 'agent',
  'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol', 'alert',
  'alien', 'all', 'alley', 'allow', 'almost', 'alone', 'alpha', 'already', 'also', 'alter',
  'always', 'amateur', 'amazing', 'among', 'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger',
  'angle', 'angry', 'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna', 'antique',
  'anxiety', 'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april', 'arcade', 'arch',
  'arctic', 'area', 'arena', 'argue', 'arm', 'armed', 'armor', 'army', 'around', 'arrange',
  'arrest', 'arrive', 'arrow', 'art', 'article', 'artist', 'artwork', 'ask', 'aspect', 'assault',
  'asset', 'assist', 'assume', 'asthma', 'athlete', 'atom', 'attack', 'attend', 'attitude', 'attract',
  'auction', 'audit', 'august', 'aunt', 'author', 'auto', 'autumn', 'average', 'avocado', 'avoid',
  'awake', 'aware', 'away', 'awesome', 'awful', 'awkward', 'axis'
];

export class WalletService {
  private static readonly WALLET_KEY = '@wallet_data';
  private static readonly SEED_PHRASE_KEY = '@secure_seed_phrase';

  // Cross-platform secure storage helpers
  private static async setSecureItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      // Use AsyncStorage for web
      await AsyncStorage.setItem(key, value);
    } else {
      // Use SecureStore for native
      await SecureStore.setItemAsync(key, value);
    }
  }

  private static async getSecureItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      // Use AsyncStorage for web
      return await AsyncStorage.getItem(key);
    } else {
      // Use SecureStore for native
      return await SecureStore.getItemAsync(key);
    }
  }

  private static async deleteSecureItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      // Use AsyncStorage for web
      await AsyncStorage.removeItem(key);
    } else {
      // Use SecureStore for native
      await SecureStore.deleteItemAsync(key);
    }
  }

  private static generateSecureRandom(length: number): Uint8Array {
    // Use crypto.getRandomValues if available (in secure contexts)
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(length);
      crypto.getRandomValues(array);
      return array;
    }
    
    // Fallback to Math.random (not cryptographically secure, but works for demo)
    const array = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }

  private static generateMnemonic(): string {
    const entropy = this.generateSecureRandom(16); // 128 bits
    const words: string[] = [];
    
    // Simple conversion of entropy to words (simplified BIP39)
    for (let i = 0; i < 12; i++) {
      const index = (entropy[i] + (entropy[(i + 1) % 16] * 256)) % WORD_LIST.length;
      words.push(WORD_LIST[index]);
    }
    
    return words.join(' ');
  }

  private static mnemonicToSeed(mnemonic: string): Uint8Array {
    // Simple seed derivation (not BIP39 compliant, but works for demo)
    const words = mnemonic.split(' ');
    const seed = new Uint8Array(32);
    
    for (let i = 0; i < 32; i++) {
      const wordIndex = i % words.length;
      const word = words[wordIndex];
      let hash = 0;
      for (let j = 0; j < word.length; j++) {
        hash = ((hash << 5) - hash + word.charCodeAt(j)) & 0xffffffff;
      }
      seed[i] = Math.abs(hash) % 256;
    }
    
    return seed;
  }

  private static validateMnemonic(mnemonic: string): boolean {
    const words = mnemonic.trim().split(/\s+/);
    if (words.length < 12 || words.length > 24) return false;
    
    // Check if all words are in our word list
    return words.every(word => WORD_LIST.includes(word.toLowerCase()));
  }

  static async generateNewWallet(): Promise<WalletData> {
    try {
      // Generate mnemonic phrase
      const mnemonic = this.generateMnemonic();
      
      // Create seed from mnemonic
      const seed = this.mnemonicToSeed(mnemonic);
      
      // Generate keypair from seed
      const keypair = Keypair.fromSeed(seed);
      
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
      if (!this.validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
      }
      
      // Create seed from mnemonic
      const seed = this.mnemonicToSeed(mnemonic);
      
      // Generate keypair from seed
      const keypair = Keypair.fromSeed(seed);
      
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