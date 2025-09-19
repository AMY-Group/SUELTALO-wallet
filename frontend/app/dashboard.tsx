import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  StatusBar,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WalletService } from '../services/WalletService';
import { ApiService } from '../services/ApiService';

const { width } = Dimensions.get('window');

interface Balance {
  SOL: number;
  USDC: number;
  SLT: number;
}

interface Transaction {
  id: string;
  from_address: string;
  to_address: string;
  amount: number;
  token_type: string;
  status: string;
  timestamp: string;
  reward_slt: number;
}

export default function DashboardScreen() {
  const router = useRouter();
  const [walletData, setWalletData] = useState<any>(null);
  const [balances, setBalances] = useState<Balance>({ SOL: 0, USDC: 0, SLT: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = new Animated.Value(0);
  const bounceAnim = new Animated.Value(0.9);

  useEffect(() => {
    loadWalletData();
    
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
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
      await loadBalances(wallet.publicKey);
      await loadTransactions(wallet.publicKey);
    } catch (error) {
      console.error('Error loading wallet data:', error);
      Alert.alert('Oops', 'No pudimos cargar tu información, inténtalo de nuevo');
    } finally {
      setLoading(false);
    }
  };

  const loadBalances = async (publicKey: string) => {
    try {
      const balanceData = await ApiService.getWalletBalance(publicKey);
      setBalances(balanceData.balances);
    } catch (error) {
      console.error('Error loading balances:', error);
    }
  };

  const loadTransactions = async (publicKey: string) => {
    try {
      const txData = await ApiService.getTransactions(publicKey);
      setTransactions(txData.slice(0, 10));
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (walletData) {
      await loadBalances(walletData.publicKey);
      await loadTransactions(walletData.publicKey);
    }
    setRefreshing(false);
  }, [walletData]);

  const handleSend = () => {
    router.push('/send');
  };

  const handleReceive = () => {
    router.push('/receive');
  };

  const handleRewards = () => {
    router.push('/rewards');
  };

  const handleKYC = () => {
    router.push('/kyc');
  };

  const handleTransactionHistory = () => {
    router.push('/transactions');
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatAmount = (amount: number, decimals: number = 4) => {
    return amount.toFixed(decimals);
  };

  const getTransactionIcon = (tx: Transaction) => {
    if (tx.from_address === walletData?.publicKey) {
      return 'arrow-up-circle';
    } else {
      return 'arrow-down-circle';
    }
  };

  const getTransactionColor = (tx: Transaction) => {
    if (tx.from_address === walletData?.publicKey) {
      return '#FF006E';
    } else {
      return '#00FF88';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LinearGradient
          colors={['#1E90FF', '#FF006E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientOverlay}
        >
          <Text style={styles.loadingText}>Cargando tu billetera... 💰</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0C0C0C" />
      
      {/* Gradient Header */}
      <LinearGradient
        colors={['#1E90FF', '#FF006E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.appName}>SUÉLTALO</Text>
            <Text style={styles.walletAddress}>{formatAddress(walletData?.publicKey)}</Text>
          </View>
          
          <TouchableOpacity style={styles.settingsButton} onPress={handleSettings}>
            <Ionicons name="settings-outline" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Neon Balance Cards */}
        <Animated.View style={[styles.balanceSection, { opacity: fadeAnim, transform: [{ scale: bounceAnim }] }]}>
          <Text style={styles.sectionTitle}>Tu Feria 💰</Text>
          
          <View style={styles.balanceGrid}>
            {/* USDC Card - Primary */}
            <View style={[styles.balanceCard, styles.primaryCard]}>
              <LinearGradient
                colors={['rgba(30, 144, 255, 0.2)', 'rgba(255, 0, 110, 0.2)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View style={styles.balanceHeader}>
                  <View style={styles.tokenIconContainer}>
                    <Ionicons name="wallet" size={32} color="#1E90FF" />
                  </View>
                  <Text style={styles.tokenLabel}>USDC</Text>
                </View>
                <Text style={styles.balanceAmount}>${formatAmount(balances.USDC, 2)}</Text>
                <Text style={styles.balanceSubtext}>Dólares digitales</Text>
              </LinearGradient>
            </View>

            {/* SOL Card */}
            <View style={styles.balanceCard}>
              <LinearGradient
                colors={['rgba(30, 144, 255, 0.15)', 'rgba(30, 144, 255, 0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View style={styles.balanceHeader}>
                  <View style={styles.tokenIconContainer}>
                    <Ionicons name="flash" size={32} color="#9945FF" />
                  </View>
                  <Text style={styles.tokenLabel}>SOL</Text>
                </View>
                <Text style={styles.balanceAmount}>{formatAmount(balances.SOL)}</Text>
                <Text style={styles.balanceSubtext}>Para fees</Text>
              </LinearGradient>
            </View>

            {/* SLT Rewards Card */}
            <View style={styles.balanceCard}>
              <LinearGradient
                colors={['rgba(0, 255, 136, 0.15)', 'rgba(0, 255, 136, 0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View style={styles.balanceHeader}>
                  <View style={styles.tokenIconContainer}>
                    <Ionicons name="gift" size={32} color="#00FF88" />
                  </View>
                  <Text style={styles.tokenLabel}>SLT</Text>
                </View>
                <Text style={styles.balanceAmount}>{formatAmount(balances.SLT)}</Text>
                <Text style={styles.balanceSubtext}>Premios ganados</Text>
              </LinearGradient>
            </View>
          </View>
        </Animated.View>

        {/* Urban Action Buttons */}
        <Animated.View style={[styles.actionSection, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.actionButton} onPress={handleSend}>
            <LinearGradient
              colors={['#FF006E', '#FF4081']}
              style={styles.actionGradient}
            >
              <Ionicons name="arrow-up" size={28} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.actionButtonText}>Mandar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleReceive}>
            <LinearGradient
              colors={['#00FF88', '#00E676']}
              style={styles.actionGradient}
            >
              <Ionicons name="arrow-down" size={28} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.actionButtonText}>Cobrar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleRewards}>
            <LinearGradient
              colors={['#1E90FF', '#2196F3']}
              style={styles.actionGradient}
            >
              <Ionicons name="gift" size={28} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.actionButtonText}>Premios</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleKYC}>
            <LinearGradient
              colors={['#FF6B35', '#FF8A65']}
              style={styles.actionGradient}
            >
              <Ionicons name="shield-checkmark" size={28} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.actionButtonText}>Verificar</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Neon Ledger Transactions */}
        <Animated.View style={[styles.transactionSection, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Movimientos Recientes</Text>
            <TouchableOpacity onPress={handleTransactionHistory}>
              <Text style={styles.viewAllText}>Ver todo</Text>
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="receipt-outline" size={64} color="#AAAAAA" />
              </View>
              <Text style={styles.emptyStateText}>¡Órale! No hay movimientos aún</Text>
              <Text style={styles.emptyStateSubtext}>Cuando mandes o recibas lana, aquí aparecerá</Text>
            </View>
          ) : (
            <View style={styles.transactionList}>
              {transactions.map((tx, index) => (
                <Animated.View 
                  key={tx.id} 
                  style={[
                    styles.transactionItem,
                    { 
                      opacity: fadeAnim,
                      transform: [{ 
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [50 * (index + 1), 0]
                        })
                      }]
                    }
                  ]}
                >
                  <LinearGradient
                    colors={['rgba(30, 144, 255, 0.05)', 'rgba(255, 0, 110, 0.05)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.transactionGradient}
                  >
                    <View style={styles.transactionLeft}>
                      <View style={[styles.transactionIconContainer, { borderColor: getTransactionColor(tx) }]}>
                        <Ionicons 
                          name={getTransactionIcon(tx)} 
                          size={24} 
                          color={getTransactionColor(tx)} 
                        />
                      </View>
                      <View style={styles.transactionDetails}>
                        <Text style={styles.transactionType}>
                          {tx.from_address === walletData?.publicKey ? 'Mandaste' : 'Te llegó'} {tx.token_type}
                        </Text>
                        <Text style={styles.transactionAddress}>
                          {tx.from_address === walletData?.publicKey 
                            ? `Para: ${formatAddress(tx.to_address)}`
                            : `De: ${formatAddress(tx.from_address)}`
                          }
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.transactionRight}>
                      <Text style={[styles.transactionAmount, { color: getTransactionColor(tx) }]}>
                        {tx.from_address === walletData?.publicKey ? '-' : '+'}
                        {formatAmount(tx.amount)} {tx.token_type}
                      </Text>
                      {tx.reward_slt > 0 && (
                        <Text style={styles.rewardText}>+{formatAmount(tx.reward_slt)} SLT 🎁</Text>
                      )}
                    </View>
                  </LinearGradient>
                </Animated.View>
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0C0C',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0C0C0C',
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
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
  headerLeft: {
    flex: 1,
  },
  appName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  walletAddress: {
    fontSize: 14,
    color: '#AAAAAA',
    fontFamily: 'monospace',
    marginTop: 4,
    letterSpacing: 1,
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  balanceSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: 1,
  },
  balanceGrid: {
    gap: 16,
  },
  balanceCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(30, 144, 255, 0.3)',
  },
  primaryCard: {
    borderColor: '#1E90FF',
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  cardGradient: {
    padding: 24,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tokenIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(30, 144, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 1,
  },
  balanceSubtext: {
    fontSize: 14,
    color: '#AAAAAA',
    letterSpacing: 0.5,
  },
  actionSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 15,
    marginBottom: 30,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  actionGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  transactionSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  viewAllText: {
    color: '#1E90FF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(170, 170, 170, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateText: {
    color: '#AAAAAA',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: '#666666',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  transactionList: {
    gap: 12,
  },
  transactionItem: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(30, 144, 255, 0.2)',
  },
  transactionGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(30, 144, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginRight: 16,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  transactionAddress: {
    color: '#AAAAAA',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rewardText: {
    color: '#00FF88',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});