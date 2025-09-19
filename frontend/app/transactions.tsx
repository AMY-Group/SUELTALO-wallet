import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StatusBar,
  Animated,
  LinearGradient
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WalletService } from '../services/WalletService';
import { ApiService } from '../services/ApiService';

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

export default function TransactionsScreen() {
  const router = useRouter();
  const [walletData, setWalletData] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, sent, received, rewards
  
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(30);

  useEffect(() => {
    loadWalletData();
    startAnimations();
  }, []);

  const startAnimations = () => {
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
  };

  const loadWalletData = async () => {
    try {
      const wallet = await WalletService.getStoredWalletData();
      if (!wallet) {
        router.replace('/');
        return;
      }
      
      setWalletData(wallet);
      await loadTransactions(wallet.publicKey);
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async (publicKey: string) => {
    try {
      const txData = await ApiService.getTransactions(publicKey);
      setTransactions(txData);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    if (walletData) {
      await loadTransactions(walletData.publicKey);
    }
    setRefreshing(false);
  }, [walletData]);

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const formatAmount = (amount: number, decimals: number = 4) => {
    return amount.toFixed(decimals);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (tx: Transaction) => {
    if (tx.from_address === 'SYSTEM_AIRDROP') {
      return 'gift-outline';
    } else if (tx.from_address === walletData?.publicKey) {
      return 'arrow-up-circle-outline';
    } else {
      return 'arrow-down-circle-outline';
    }
  };

  const getTransactionColor = (tx: Transaction) => {
    if (tx.from_address === 'SYSTEM_AIRDROP') {
      return '#FFD700';
    } else if (tx.from_address === walletData?.publicKey) {
      return '#FF006E';
    } else {
      return '#00FF88';
    }
  };

  const getTransactionType = (tx: Transaction) => {
    if (tx.from_address === 'SYSTEM_AIRDROP') {
      return 'Airdrop';
    } else if (tx.from_address === walletData?.publicKey) {
      return 'Enviado';
    } else {
      return 'Recibido';
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    if (filter === 'sent') return tx.from_address === walletData?.publicKey;
    if (filter === 'received') return tx.to_address === walletData?.publicKey && tx.from_address !== 'SYSTEM_AIRDROP';
    if (filter === 'rewards') return tx.from_address === 'SYSTEM_AIRDROP' || tx.reward_slt > 0;
    return true;
  });

  const filterOptions = [
    { key: 'all', label: 'Todo', icon: 'list-outline', color: '#1E90FF' },
    { key: 'sent', label: 'Enviado', icon: 'arrow-up-circle-outline', color: '#FF006E' },
    { key: 'received', label: 'Recibido', icon: 'arrow-down-circle-outline', color: '#00FF88' },
    { key: 'rewards', label: 'Rewards', icon: 'gift-outline', color: '#FFD700' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LinearGradient
          colors={['#1E90FF', '#FF006E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientOverlay}
        >
          <Text style={styles.loadingText}>Cargando transacciones...</Text>
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
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Historial</Text>
          
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filteredTransactions.length}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Urban Filter Tabs */}
      <Animated.View style={[styles.filterSection, { opacity: fadeAnim }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContainer}>
          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.filterButton,
                filter === option.key && styles.activeFilterButton
              ]}
              onPress={() => setFilter(option.key)}
            >
              <LinearGradient
                colors={filter === option.key 
                  ? [option.color, option.color + '80'] 
                  : ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.filterGradient}
              >
                <Ionicons 
                  name={option.icon as any} 
                  size={20} 
                  color={filter === option.key ? '#FFFFFF' : option.color} 
                />
                <Text style={[
                  styles.filterText,
                  filter === option.key && styles.activeFilterText
                ]}>
                  {option.label}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Neon Ledger */}
      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredTransactions.length === 0 ? (
          <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="receipt-outline" size={64} color="#AAAAAA" />
            </View>
            <Text style={styles.emptyStateText}>Sin transacciones aún</Text>
            <Text style={styles.emptyStateSubtext}>
              {filter === 'all' ? 'Tu historial aparecerá aquí' : 
               filter === 'sent' ? 'No has enviado transacciones aún' :
               filter === 'received' ? 'No has recibido transacciones aún' :
               'No tienes rewards aún'}
            </Text>
          </Animated.View>
        ) : (
          <Animated.View style={[styles.transactionsList, { opacity: fadeAnim }]}>
            {filteredTransactions.map((tx, index) => (
              <Animated.View
                key={tx.id}
                style={[
                  styles.transactionItem,
                  {
                    transform: [{
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [slideAnim._value * (index + 1), 0]
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
                  <View style={styles.transactionContent}>
                    {/* Left Side - Icon & Details */}
                    <View style={styles.transactionLeft}>
                      <View style={[styles.transactionIconContainer, { borderColor: getTransactionColor(tx) }]}>
                        <Ionicons 
                          name={getTransactionIcon(tx) as any} 
                          size={24} 
                          color={getTransactionColor(tx)} 
                        />
                      </View>
                      
                      <View style={styles.transactionDetails}>
                        <View style={styles.transactionHeader}>
                          <Text style={styles.transactionType}>
                            {getTransactionType(tx)} {tx.token_type}
                          </Text>
                          <View style={[styles.statusBadge, { backgroundColor: getTransactionColor(tx) + '20' }]}>
                            <Text style={[styles.statusText, { color: getTransactionColor(tx) }]}>
                              {tx.status === 'confirmed' ? '✓' : '⏳'}
                            </Text>
                          </View>
                        </View>
                        
                        <Text style={styles.transactionAddress}>
                          {tx.from_address === 'SYSTEM_AIRDROP' ? 'Sistema SUÉLTALO' :
                           tx.from_address === walletData?.publicKey 
                            ? `Para: ${formatAddress(tx.to_address)}`
                            : `De: ${formatAddress(tx.from_address)}`
                          }
                        </Text>
                        
                        <Text style={styles.transactionDate}>
                          {formatDate(tx.timestamp)}
                        </Text>
                      </View>
                    </View>
                    
                    {/* Right Side - Amount & Rewards */}
                    <View style={styles.transactionRight}>
                      <Text style={[styles.transactionAmount, { color: getTransactionColor(tx) }]}>
                        {tx.from_address === walletData?.publicKey ? '-' : '+'}
                        {formatAmount(tx.amount)} {tx.token_type}
                      </Text>
                      
                      {tx.reward_slt > 0 && (
                        <View style={styles.rewardContainer}>
                          <Ionicons name="gift" size={12} color="#00FF88" />
                          <Text style={styles.rewardText}>+{formatAmount(tx.reward_slt)} SLT</Text>
                        </View>
                      )}
                      
                      {tx.token_type === 'SLT' && tx.from_address === 'SYSTEM_AIRDROP' && (
                        <View style={styles.airdropBadge}>
                          <Text style={styles.airdropText}>🎁 AIRDROP</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </LinearGradient>
              </Animated.View>
            ))}
          </Animated.View>
        )}
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
    fontSize: 18,
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
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  filterSection: {
    paddingVertical: 20,
  },
  filterScrollContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  activeFilterButton: {
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  filterGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterText: {
    color: '#AAAAAA',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(170, 170, 170, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateText: {
    color: '#AAAAAA',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: '#666666',
    fontSize: 16,
    textAlign: 'center',
  },
  transactionsList: {
    paddingBottom: 40,
    gap: 16,
  },
  transactionItem: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  transactionGradient: {
    borderWidth: 1,
    borderColor: 'rgba(30, 144, 255, 0.2)',
  },
  transactionContent: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(30, 144, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginRight: 16,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  transactionType: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  transactionAddress: {
    color: '#AAAAAA',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  transactionDate: {
    color: '#666666',
    fontSize: 11,
    fontWeight: '500',
  },
  transactionRight: {
    alignItems: 'flex-end',
    marginLeft: 16,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  rewardText: {
    color: '#00FF88',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  airdropBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  airdropText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '700',
  },
});