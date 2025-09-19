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
} from 'react-native';
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
      await loadBalances(wallet.publicKey);
      await loadTransactions(wallet.publicKey);
    } catch (error) {
      console.error('Error loading wallet data:', error);
      Alert.alert('Error', 'Failed to load wallet data');
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
      setTransactions(txData.slice(0, 10)); // Show last 10 transactions
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
      return '#FF6B35'; // Sent - red
    } else {
      return '#00FF88'; // Received - green
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading wallet...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.appName}>SUÉLTALO</Text>
          <Text style={styles.walletAddress}>{formatAddress(walletData?.publicKey)}</Text>
        </View>
        
        <TouchableOpacity style={styles.settingsButton} onPress={handleSettings}>
          <Ionicons name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Cards */}
        <View style={styles.balanceSection}>
          <Text style={styles.sectionTitle}>Portfolio</Text>
          
          <View style={styles.balanceGrid}>
            <View style={[styles.balanceCard, styles.primaryCard]}>
              <View style={styles.balanceHeader}>
                <Ionicons name="wallet" size={24} color="#00D4FF" />
                <Text style={styles.tokenLabel}>USDC</Text>
              </View>
              <Text style={styles.balanceAmount}>${formatAmount(balances.USDC, 2)}</Text>
              <Text style={styles.balanceSubtext}>USD Coin</Text>
            </View>

            <View style={styles.balanceCard}>
              <View style={styles.balanceHeader}>
                <Ionicons name="flash" size={24} color="#9945FF" />
                <Text style={styles.tokenLabel}>SOL</Text>
              </View>
              <Text style={styles.balanceAmount}>{formatAmount(balances.SOL)}</Text>
              <Text style={styles.balanceSubtext}>Solana</Text>
            </View>

            <View style={styles.balanceCard}>
              <View style={styles.balanceHeader}>
                <Ionicons name="gift" size={24} color="#00FF88" />
                <Text style={styles.tokenLabel}>SLT</Text>
              </View>
              <Text style={styles.balanceAmount}>{formatAmount(balances.SLT)}</Text>
              <Text style={styles.balanceSubtext}>Rewards</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.actionButton} onPress={handleSend}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="arrow-up" size={24} color="#0a0a0a" />
            </View>
            <Text style={styles.actionButtonText}>Send</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleReceive}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="arrow-down" size={24} color="#0a0a0a" />
            </View>
            <Text style={styles.actionButtonText}>Receive</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleTransactionHistory}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="time" size={24} color="#0a0a0a" />
            </View>
            <Text style={styles.actionButtonText}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={handleTransactionHistory}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#666" />
              <Text style={styles.emptyStateText}>No transactions yet</Text>
              <Text style={styles.emptyStateSubtext}>Your transaction history will appear here</Text>
            </View>
          ) : (
            <View style={styles.transactionList}>
              {transactions.map((tx) => (
                <View key={tx.id} style={styles.transactionItem}>
                  <View style={styles.transactionLeft}>
                    <Ionicons 
                      name={getTransactionIcon(tx)} 
                      size={24} 
                      color={getTransactionColor(tx)} 
                    />
                    <View style={styles.transactionDetails}>
                      <Text style={styles.transactionType}>
                        {tx.from_address === walletData?.publicKey ? 'Sent' : 'Received'} {tx.token_type}
                      </Text>
                      <Text style={styles.transactionAddress}>
                        {tx.from_address === walletData?.publicKey 
                          ? `To: ${formatAddress(tx.to_address)}`
                          : `From: ${formatAddress(tx.from_address)}`
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
                      <Text style={styles.rewardText}>+{formatAmount(tx.reward_slt)} SLT</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerLeft: {
    flex: 1,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00D4FF',
    letterSpacing: 1,
  },
  walletAddress: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  settingsButton: {
    padding: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  balanceSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  balanceGrid: {
    gap: 12,
  },
  balanceCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  primaryCard: {
    borderColor: '#00D4FF',
    backgroundColor: '#001122',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tokenLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  balanceSubtext: {
    fontSize: 12,
    color: '#666',
  },
  actionSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  actionIconContainer: {
    backgroundColor: '#00D4FF',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  transactionSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  viewAllText: {
    color: '#00D4FF',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  emptyStateSubtext: {
    color: '#555',
    fontSize: 14,
    marginTop: 4,
  },
  transactionList: {
    gap: 12,
  },
  transactionItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionDetails: {
    marginLeft: 12,
    flex: 1,
  },
  transactionType: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  transactionAddress: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  rewardText: {
    color: '#00FF88',
    fontSize: 10,
    marginTop: 2,
  },
});