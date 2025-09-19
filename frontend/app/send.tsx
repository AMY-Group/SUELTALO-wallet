import React, { useState, useEffect } from 'react';
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
import { WalletService } from '../services/WalletService';
import { ApiService } from '../services/ApiService';

export default function SendScreen() {
  const router = useRouter();
  const [walletData, setWalletData] = useState<any>(null);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('USDC');
  const [loading, setLoading] = useState(false);
  const [balances, setBalances] = useState({ SOL: 0, USDC: 0, SLT: 0 });

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const wallet = await WalletService.getStoredWalletData();
      if (!wallet) {
        router.replace('/');
        return;
      }
      
      setWalletData(wallet);
      
      // Load balances
      const balanceData = await ApiService.getWalletBalance(wallet.publicKey);
      setBalances(balanceData.balances);
    } catch (error) {
      console.error('Error loading wallet data:', error);
    }
  };

  const validateInputs = () => {
    if (!recipientAddress.trim()) {
      Alert.alert('Error', 'Please enter recipient address');
      return false;
    }

    if (!WalletService.validatePublicKey(recipientAddress)) {
      Alert.alert('Error', 'Invalid recipient address');
      return false;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return false;
    }

    const amountNum = parseFloat(amount);
    const availableBalance = balances[selectedToken as keyof typeof balances];
    
    if (amountNum > availableBalance) {
      Alert.alert('Error', `Insufficient ${selectedToken} balance`);
      return false;
    }

    return true;
  };

  const handleSend = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      // Create transaction record
      const transaction = await ApiService.createTransaction({
        from_address: walletData.publicKey,
        to_address: recipientAddress,
        amount: parseFloat(amount),
        token_type: selectedToken,
      });

      // In a real implementation, you would:
      // 1. Create the Solana transaction
      // 2. Sign it with the user's private key
      // 3. Broadcast it to the network
      // 4. Update the transaction status
      
      Alert.alert(
        'Transaction Initiated',
        `Sending ${amount} ${selectedToken} to ${recipientAddress.slice(0, 8)}...${recipientAddress.slice(-8)}`,
        [
          {
            text: 'View Transaction',
            onPress: () => router.push('/transactions'),
          },
          {
            text: 'Done',
            onPress: () => router.back(),
          },
        ]
      );

      // Reset form
      setRecipientAddress('');
      setAmount('');
    } catch (error) {
      console.error('Send error:', error);
      Alert.alert('Error', 'Failed to send transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleScanQR = () => {
    router.push('/scan');
  };

  const handleMaxAmount = () => {
    const maxBalance = balances[selectedToken as keyof typeof balances];
    setAmount(maxBalance.toString());
  };

  const tokenOptions = [
    { symbol: 'USDC', name: 'USD Coin', icon: 'card' },
    { symbol: 'SOL', name: 'Solana', icon: 'flash' },
    { symbol: 'SLT', name: 'SUÉLTALO Token', icon: 'gift' },
  ];

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
        
        <Text style={styles.headerTitle}>Send Crypto</Text>
        
        <TouchableOpacity style={styles.scanButton} onPress={handleScanQR}>
          <Ionicons name="qr-code-outline" size={24} color="#00D4FF" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Token Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Token</Text>
            <View style={styles.tokenGrid}>
              {tokenOptions.map((token) => (
                <TouchableOpacity
                  key={token.symbol}
                  style={[
                    styles.tokenOption,
                    selectedToken === token.symbol && styles.selectedToken
                  ]}
                  onPress={() => setSelectedToken(token.symbol)}
                >
                  <Ionicons 
                    name={token.icon as any} 
                    size={24} 
                    color={selectedToken === token.symbol ? '#00D4FF' : '#666'} 
                  />
                  <Text style={[
                    styles.tokenSymbol,
                    selectedToken === token.symbol && styles.selectedTokenText
                  ]}>
                    {token.symbol}
                  </Text>
                  <Text style={styles.tokenName}>{token.name}</Text>
                  <Text style={styles.tokenBalance}>
                    {balances[token.symbol as keyof typeof balances].toFixed(4)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recipient Address */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recipient Address</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.addressInput}
                placeholder="Enter Solana wallet address..."
                placeholderTextColor="#666"
                value={recipientAddress}
                onChangeText={setRecipientAddress}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={styles.qrButton} onPress={handleScanQR}>
                <Ionicons name="qr-code" size={20} color="#00D4FF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Amount */}
          <View style={styles.section}>
            <View style={styles.amountHeader}>
              <Text style={styles.sectionTitle}>Amount</Text>
              <TouchableOpacity style={styles.maxButton} onPress={handleMaxAmount}>
                <Text style={styles.maxButtonText}>MAX</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.amountContainer}>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="#666"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
              <Text style={styles.tokenLabel}>{selectedToken}</Text>
            </View>
            
            <Text style={styles.balanceText}>
              Available: {balances[selectedToken as keyof typeof balances].toFixed(4)} {selectedToken}
            </Text>
          </View>

          {/* Transaction Preview */}
          {recipientAddress && amount && (
            <View style={styles.previewSection}>
              <Text style={styles.sectionTitle}>Transaction Preview</Text>
              <View style={styles.previewCard}>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>From:</Text>
                  <Text style={styles.previewValue}>
                    {walletData?.publicKey.slice(0, 8)}...{walletData?.publicKey.slice(-8)}
                  </Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>To:</Text>
                  <Text style={styles.previewValue}>
                    {recipientAddress.slice(0, 8)}...{recipientAddress.slice(-8)}
                  </Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Amount:</Text>
                  <Text style={styles.previewValue}>{amount} {selectedToken}</Text>
                </View>
                {selectedToken === 'USDC' && (
                  <View style={styles.rewardRow}>
                    <Text style={styles.rewardLabel}>SLT Reward:</Text>
                    <Text style={styles.rewardValue}>+{(parseFloat(amount || '0') * 0.1).toFixed(2)} SLT</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Send Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!recipientAddress || !amount || loading) && styles.disabledButton
            ]}
            onPress={handleSend}
            disabled={!recipientAddress || !amount || loading}
          >
            {loading ? (
              <ActivityIndicator color="#0a0a0a" size="small" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#0a0a0a" />
                <Text style={styles.sendButtonText}>Send {selectedToken}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  scanButton: {
    padding: 4,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  tokenGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  tokenOption: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  selectedToken: {
    borderColor: '#00D4FF',
    backgroundColor: '#001122',
  },
  tokenSymbol: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
  },
  selectedTokenText: {
    color: '#00D4FF',
  },
  tokenName: {
    fontSize: 10,
    color: '#555',
    marginTop: 2,
  },
  tokenBalance: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  addressInput: {
    flex: 1,
    padding: 16,
    color: '#fff',
    fontSize: 14,
  },
  qrButton: {
    padding: 16,
  },
  amountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  maxButton: {
    backgroundColor: '#00D4FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  maxButtonText: {
    color: '#0a0a0a',
    fontSize: 12,
    fontWeight: '600',
  },
  amountContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 20,
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  tokenLabel: {
    color: '#00D4FF',
    fontSize: 16,
    fontWeight: '600',
  },
  balanceText: {
    color: '#666',
    fontSize: 12,
    marginTop: 8,
  },
  previewSection: {
    marginVertical: 16,
  },
  previewCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  previewLabel: {
    color: '#888',
    fontSize: 14,
  },
  previewValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  rewardLabel: {
    color: '#00FF88',
    fontSize: 14,
  },
  rewardValue: {
    color: '#00FF88',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    padding: 20,
  },
  sendButton: {
    backgroundColor: '#00D4FF',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#333',
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#0a0a0a',
    fontSize: 16,
    fontWeight: '600',
  },
});