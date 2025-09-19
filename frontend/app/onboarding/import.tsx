import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WalletService } from '../../services/WalletService';

export default function ImportWalletScreen() {
  const router = useRouter();
  const [seedPhrase, setSeedPhrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [walletData, setWalletData] = useState<any>(null);

  const validateAndImportWallet = async () => {
    if (!seedPhrase.trim()) {
      Alert.alert('Error', 'Please enter your seed phrase');
      return;
    }

    const words = seedPhrase.trim().split(/\s+/);
    if (words.length < 12 || words.length > 24) {
      Alert.alert('Error', 'Seed phrase must be 12-24 words');
      return;
    }

    setLoading(true);
    try {
      const wallet = await WalletService.restoreWalletFromMnemonic(seedPhrase.trim());
      setWalletData(wallet);
      setStep(2);
    } catch (error) {
      Alert.alert('Error', 'Invalid seed phrase. Please check and try again.');
      console.error('Wallet import error:', error);
    } finally {
      setLoading(false);
    }
  };

  const finishImport = () => {
    Alert.alert(
      'Wallet Imported Successfully!',
      'Your SUÉLTALO wallet has been imported and is ready to use.',
      [
        {
          text: 'Go to Dashboard',
          onPress: () => router.replace('/dashboard'),
        },
      ]
    );
  };

  const renderStep1 = () => (
    <KeyboardAvoidingView 
      style={styles.stepContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="download-outline" size={60} color="#00D4FF" />
      </View>
      
      <Text style={styles.title}>Import Existing Wallet</Text>
      <Text style={styles.subtitle}>
        Enter your 12 or 24-word seed phrase to restore your wallet. Make sure you're in a secure location.
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Seed Phrase</Text>
        <TextInput
          style={styles.seedInput}
          placeholder="Enter your seed phrase words separated by spaces..."
          placeholderTextColor="#666"
          value={seedPhrase}
          onChangeText={setSeedPhrase}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={false}
        />
        <Text style={styles.wordCount}>
          {seedPhrase.trim().split(/\s+/).filter(word => word.length > 0).length} words
        </Text>
      </View>

      <View style={styles.warningBox}>
        <Ionicons name="shield-checkmark" size={20} color="#00FF88" />
        <Text style={styles.warningText}>
          Your seed phrase is processed locally and never sent to our servers.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, (!seedPhrase.trim() || loading) && styles.disabledButton]}
        onPress={validateAndImportWallet}
        disabled={!seedPhrase.trim() || loading}
      >
        {loading ? (
          <ActivityIndicator color="#0a0a0a" size="small" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={20} color="#0a0a0a" />
            <Text style={styles.primaryButtonText}>Import Wallet</Text>
          </>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="checkmark-circle" size={60} color="#00FF88" />
      </View>

      <Text style={styles.title}>Wallet Imported!</Text>
      <Text style={styles.subtitle}>
        Your wallet has been successfully imported. You can now access your funds and transaction history.
      </Text>

      <View style={styles.walletInfo}>
        <Text style={styles.walletLabel}>Wallet Address:</Text>
        <Text style={styles.walletAddress}>{walletData?.publicKey}</Text>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={finishImport}
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
        
        <Text style={styles.headerTitle}>Import Wallet</Text>
        
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>{step}/2</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
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
    marginBottom: 32,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  seedInput: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  wordCount: {
    color: '#666',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'right',
  },
  warningBox: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#00FF88',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
  },
  warningText: {
    color: '#00FF88',
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
  disabledButton: {
    backgroundColor: '#333',
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#0a0a0a',
    fontSize: 16,
    fontWeight: '600',
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