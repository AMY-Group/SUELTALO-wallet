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
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WalletService } from '../../services/WalletService';
import { ApiService } from '../../services/ApiService';

export default function SendScreen() {
  const router = useRouter();
  const [walletData, setWalletData] = useState<any>(null);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('USDC');
  const [loading, setLoading] = useState(false);
  const [balances, setBalances] = useState({ SOL: 0, USDC: 0, SLT: 0 });
  
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  useEffect(() => {
    loadWalletData();
    
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
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
      Alert.alert('¡Órale!', 'Ponle la dirección de a quién le vas a mandar');
      return false;
    }

    if (!WalletService.validatePublicKey(recipientAddress)) {
      Alert.alert('¡Esa dirección no está bien!', 'Revísala otra vez o escanea el código QR');
      return false;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('¿Cuánto vas a mandar?', 'Ponle una cantidad válida');
      return false;
    }

    const amountNum = parseFloat(amount);
    const availableBalance = balances[selectedToken as keyof typeof balances];
    
    if (amountNum > availableBalance) {
      Alert.alert('¡Te falta lana!', `No tienes suficientes ${selectedToken} en tu billetera`);
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

      // Success animation
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: -20,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      Alert.alert(
        '¡Órale! Tu lana ya salió 🚀',
        `Mandaste ${amount} ${selectedToken} al toque`,
        [
          {
            text: 'Ver movimiento',
            onPress: () => router.push('/transactions'),
          },
          {
            text: 'Dale',
            onPress: () => router.back(),
          },
        ]
      );

      // Reset form
      setRecipientAddress('');
      setAmount('');
    } catch (error) {
      console.error('Send error:', error);
      Alert.alert('¡No se pudo!', 'Algo pasó, inténtalo otra vez');
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
    { symbol: 'USDC', name: 'Dólares digitales', icon: 'card', color: '#1E90FF', gradient: ['#1E90FF', '#00BFFF'] },
    { symbol: 'SOL', name: 'Para fees', icon: 'flash', color: '#9945FF', gradient: ['#9945FF', '#BB86FC'] },
    { symbol: 'SLT', name: 'Premios ganados', icon: 'gift', color: '#00FF88', gradient: ['#00FF88', '#4CAF50'] },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0C0C0C" />
      
      {/* Gradient Header */}
      <LinearGradient
        colors={['#FF006E', '#1E90FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Mandar Lana 💸</Text>
          
          <TouchableOpacity style={styles.scanButton} onPress={handleScanQR}>
            <Ionicons name="qr-code-outline" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Urban Token Selection */}
          <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.sectionTitle}>¿Qué vas a mandar? 💰</Text>
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
                  <LinearGradient
                    colors={selectedToken === token.symbol ? token.gradient : ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.tokenGradient}
                  >
                    <View style={[styles.tokenIconContainer, { backgroundColor: token.color + '20' }]}>
                      <Ionicons 
                        name={token.icon as any} 
                        size={28} 
                        color={selectedToken === token.symbol ? '#FFFFFF' : token.color} 
                      />
                    </View>
                    <Text style={[
                      styles.tokenSymbol,
                      selectedToken === token.symbol && styles.selectedTokenText
                    ]}>
                      {token.symbol}
                    </Text>
                    <Text style={[
                      styles.tokenName,
                      selectedToken === token.symbol && { color: '#FFFFFF' }
                    ]}>{token.name}</Text>
                    <Text style={[
                      styles.tokenBalance,
                      selectedToken === token.symbol && { color: '#FFFFFF' }
                    ]}>
                      {balances[token.symbol as keyof typeof balances].toFixed(4)}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Neon Recipient Address */}
          <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.sectionTitle}>¿A quién le mandas? 📍</Text>
            <View style={styles.neonInputContainer}>
              <LinearGradient
                colors={recipientAddress ? ['rgba(30, 144, 255, 0.2)', 'rgba(255, 0, 110, 0.2)'] : ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.inputGradient}
              >
                <TextInput
                  style={styles.addressInput}
                  placeholder="Pega la dirección aquí o escanea el QR..."
                  placeholderTextColor="#666666"
                  value={recipientAddress}
                  onChangeText={setRecipientAddress}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity style={styles.qrButton} onPress={handleScanQR}>
                  <LinearGradient
                    colors={['#FF006E', '#FF4081']}
                    style={styles.qrButtonGradient}
                  >
                    <Ionicons name="qr-code" size={24} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </Animated.View>

          {/* Urban Amount Input */}
          <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.amountHeader}>
              <Text style={styles.sectionTitle}>¿Cuánto mandas? 💸</Text>
              <TouchableOpacity style={styles.maxButton} onPress={handleMaxAmount}>
                <LinearGradient
                  colors={['#00FF88', '#4CAF50']}
                  style={styles.maxGradient}
                >
                  <Text style={styles.maxButtonText}>TODO</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            
            <View style={styles.neonAmountContainer}>
              <LinearGradient
                colors={amount ? ['rgba(30, 144, 255, 0.2)', 'rgba(255, 0, 110, 0.2)'] : ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.amountGradient}
              >
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor="#666666"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                />
                <View style={styles.tokenLabelContainer}>
                  <Text style={styles.tokenLabel}>{selectedToken}</Text>
                </View>
              </LinearGradient>
            </View>
            
            <Text style={styles.balanceText}>
              💳 Tienes: {balances[selectedToken as keyof typeof balances].toFixed(4)} {selectedToken}
            </Text>
          </Animated.View>

          {/* Street-Style Transaction Preview */}
          {recipientAddress && amount && (
            <Animated.View style={[styles.previewSection, { opacity: fadeAnim }]}>
              <Text style={styles.sectionTitle}>Revisa antes de mandar 👀</Text>
              <LinearGradient
                colors={['rgba(30, 144, 255, 0.1)', 'rgba(255, 0, 110, 0.1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.previewGradient}
              >
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>🏠 De tu billetera:</Text>
                  <Text style={styles.previewValue}>
                    {walletData?.publicKey.slice(0, 8)}...{walletData?.publicKey.slice(-8)}
                  </Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>📱 Para:</Text>
                  <Text style={styles.previewValue}>
                    {recipientAddress.slice(0, 8)}...{recipientAddress.slice(-8)}
                  </Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>💰 Cantidad:</Text>
                  <Text style={styles.previewValue}>{amount} {selectedToken}</Text>
                </View>
                {selectedToken === 'USDC' && (
                  <View style={styles.rewardRow}>
                    <Text style={styles.rewardLabel}>🎁 Premio que te ganas:</Text>
                    <Text style={styles.rewardValue}>+{(parseFloat(amount || '0') * 0.1).toFixed(2)} SLT</Text>
                  </View>
                )}
              </LinearGradient>
            </Animated.View>
          )}
        </ScrollView>

        {/* Urban Send Button */}
        <Animated.View style={[styles.buttonContainer, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!recipientAddress || !amount || loading) && styles.disabledButton
            ]}
            onPress={handleSend}
            disabled={!recipientAddress || !amount || loading}
          >
            <LinearGradient
              colors={(!recipientAddress || !amount || loading) 
                ? ['#333333', '#444444'] 
                : ['#FF006E', '#1E90FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sendGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="send" size={24} color="#FFFFFF" />
                  <Text style={styles.sendButtonText}>¡Mandar {selectedToken} al toque! 🚀</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0C0C',
  },
  gradientHeader: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  scanButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  tokenGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  tokenOption: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  selectedToken: {
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  tokenGradient: {
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tokenIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: '800',
    color: '#AAAAAA',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  selectedTokenText: {
    color: '#FFFFFF',
  },
  tokenName: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
    textAlign: 'center',
  },
  tokenBalance: {
    fontSize: 14,
    color: '#AAAAAA',
    fontWeight: '600',
  },
  neonInputContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  inputGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(30, 144, 255, 0.3)',
  },
  addressInput: {
    flex: 1,
    padding: 20,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  qrButton: {
    padding: 12,
    margin: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  qrButtonGradient: {
    padding: 8,
    borderRadius: 12,
  },
  amountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  maxButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  maxGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  maxButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  neonAmountContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  amountGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(30, 144, 255, 0.3)',
  },
  amountInput: {
    flex: 1,
    paddingVertical: 24,
    paddingHorizontal: 20,
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tokenLabelContainer: {
    backgroundColor: 'rgba(30, 144, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 16,
  },
  tokenLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  balanceText: {
    color: '#AAAAAA',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  previewSection: {
    marginVertical: 20,
  },
  previewGradient: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(30, 144, 255, 0.3)',
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  previewLabel: {
    color: '#AAAAAA',
    fontSize: 16,
    fontWeight: '600',
  },
  previewValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  rewardLabel: {
    color: '#00FF88',
    fontSize: 16,
    fontWeight: '600',
  },
  rewardValue: {
    color: '#00FF88',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  buttonContainer: {
    padding: 20,
  },
  sendButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.5,
  },
  sendGradient: {
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
});