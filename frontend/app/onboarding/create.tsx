import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WalletService } from '../../services/WalletService';

export default function CreateWalletScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [walletData, setWalletData] = useState<any>(null);
  const [seedPhraseRevealed, setSeedPhraseRevealed] = useState(false);
  const [seedPhraseConfirmed, setSeedPhraseConfirmed] = useState(false);

  const createWallet = async () => {
    setLoading(true);
    try {
      const newWallet = await WalletService.generateNewWallet();
      setWalletData(newWallet);
      setStep(2);
    } catch (error) {
      Alert.alert('Error', 'Failed to create wallet. Please try again.');
      console.error('Wallet creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedPhraseReveal = () => {
    setSeedPhraseRevealed(true);
  };

  const confirmSeedPhrase = () => {
    setSeedPhraseConfirmed(true);
    setStep(3);
  };

  const finishSetup = () => {
    Alert.alert(
      'Wallet Created Successfully!',
      'Your SUÉLTALO wallet has been created. Keep your seed phrase safe!',
      [
        {
          text: 'Go to Dashboard',
          onPress: () => router.replace('/dashboard'),
        },
      ]
    );
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="add-circle-outline" size={60} color="#00D4FF" />
      </View>
      
      <Text style={styles.title}>Create New Wallet</Text>
      <Text style={styles.subtitle}>
        We'll generate a new 12-word seed phrase for your wallet. This phrase is your master key - keep it safe and never share it with anyone.
      </Text>

      <View style={styles.warningBox}>
        <Ionicons name="warning" size={20} color="#FF6B35" />
        <Text style={styles.warningText}>
          SUÉLTALO is non-custodial. We cannot recover your wallet if you lose your seed phrase.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={createWallet}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#0a0a0a" size="small" />
        ) : (
          <>
            <Ionicons name="shield-checkmark" size={20} color="#0a0a0a" />
            <Text style={styles.primaryButtonText}>Generate Seed Phrase</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="eye" size={60} color="#00D4FF" />
      </View>

      <Text style={styles.title}>Your Seed Phrase</Text>
      <Text style={styles.subtitle}>
        Write down these 12 words in order and store them safely. This is the only way to recover your wallet.
      </Text>

      {!seedPhraseRevealed ? (
        <View style={styles.hiddenSeedContainer}>
          <Ionicons name="eye-off" size={40} color="#666" />
          <Text style={styles.hiddenSeedText}>
            Tap to reveal your seed phrase
          </Text>
          <TouchableOpacity
            style={styles.revealButton}
            onPress={handleSeedPhraseReveal}
          >
            <Text style={styles.revealButtonText}>Reveal Seed Phrase</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.seedPhraseContainer}>
          {walletData?.mnemonic.split(' ').map((word: string, index: number) => (
            <View key={index} style={styles.seedWord}>
              <Text style={styles.seedWordNumber}>{index + 1}</Text>
              <Text style={styles.seedWordText}>{word}</Text>
            </View>
          ))}
        </View>
      )}

      {seedPhraseRevealed && (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={confirmSeedPhrase}
        >
          <Ionicons name="checkmark-circle" size={20} color="#0a0a0a" />
          <Text style={styles.primaryButtonText}>I've Saved My Seed Phrase</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="checkmark-circle" size={60} color="#00FF88" />
      </View>

      <Text style={styles.title}>Wallet Created!</Text>
      <Text style={styles.subtitle}>
        Your SUÉLTALO wallet has been successfully created. You can now send and receive USDC on Solana.
      </Text>

      <View style={styles.walletInfo}>
        <Text style={styles.walletLabel}>Wallet Address:</Text>
        <Text style={styles.walletAddress}>{walletData?.publicKey}</Text>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={finishSetup}
      >
        <Ionicons name="arrow-forward" size={20} color="#0a0a0a" />
        <Text style={styles.primaryButtonText}>Access My Wallet</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#00D4FF" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Create Wallet</Text>
        
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>{step}/3</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  stepIndicator: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stepText: {
    color: '#00D4FF',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  warningBox: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  warningText: {
    color: '#FF6B35',
    fontSize: 14,
    flex: 1,
    marginLeft: 12,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#00D4FF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minWidth: 200,
  },
  primaryButtonText: {
    color: '#0a0a0a',
    fontSize: 16,
    fontWeight: '600',
  },
  hiddenSeedContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#333',
  },
  hiddenSeedText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  revealButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#00D4FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  revealButtonText: {
    color: '#00D4FF',
    fontSize: 14,
    fontWeight: '600',
  },
  seedPhraseContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  seedWord: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: '30%',
  },
  seedWordNumber: {
    color: '#00D4FF',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
  },
  seedWordText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  walletInfo: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    width: '100%',
  },
  walletLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  walletAddress: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
});