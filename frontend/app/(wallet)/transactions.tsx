import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WalletService } from '../../services/WalletService';
import { ApiService } from '../../services/ApiService';

interface Transaction {
  id: string;
  from_address: string;
  to_address: string;
  amount: number;
  token_type: string;
  created_at: string;
  status: string;
}

export default function TransactionsScreen() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [walletData, setWalletData] = useState<any>(null);

  useEffect(() => {
    loadWalletAndTransactions();
  }, []);

  const loadWalletAndTransactions = async () => {
    try {
      const wallet = await WalletService.getStoredWalletData();
      if (!wallet) {
        router.replace('/');
        return;
      }
      
      setWalletData(wallet);
      await loadTransactions(wallet.publicKey);
    } catch (error) {
      console.error('Error loading wallet:', error);
      Alert.alert('Error', 'No pudimos cargar tu información');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async (publicKey: string) => {
    try {
      const response = await ApiService.getTransactions(publicKey);
      setTransactions(response.transactions || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      Alert.alert('Error', 'No pudimos cargar tus transacciones');
    }
  };

  const onRefresh = async () => {
    if (!walletData) return;
    
    setRefreshing(true);
    await loadTransactions(walletData.publicKey);
    setRefreshing(false);
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatAmount = (amount: number, decimals: number = 6) => {
    return (amount / Math.pow(10, decimals)).toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: decimals === 6 ? 6 : 2,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isOutgoing = item.from_address === walletData?.publicKey;
    const otherAddress = isOutgoing ? item.to_address : item.from_address;

    return (
      <View style={styles.transactionCard}>
        <LinearGradient
          colors={isOutgoing 
            ? ['rgba(255, 0, 110, 0.1)', 'rgba(255, 0, 110, 0.05)']
            : ['rgba(0, 255, 136, 0.1)', 'rgba(0, 255, 136, 0.05)']
          }
          style={styles.transactionGradient}
        >
          <View style={styles.transactionHeader}>
            <View style={styles.transactionIcon}>
              <Ionicons 
                name={isOutgoing ? 'arrow-up-circle' : 'arrow-down-circle'} 
                size={24} 
                color={isOutgoing ? '#FF006E' : '#00FF88'} 
              />
            </View>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionType}>
                {isOutgoing ? 'Enviaste' : 'Recibiste'} {item.token_type}
              </Text>
              <Text style={styles.transactionAddress}>
                {isOutgoing ? 'A: ' : 'De: '}{formatAddress(otherAddress)}
              </Text>
            </View>
            <View style={styles.transactionAmount}>
              <Text style={[
                styles.amountText,
                { color: isOutgoing ? '#FF006E' : '#00FF88' }
              ]}>
                {isOutgoing ? '-' : '+'}
                {formatAmount(item.amount)} {item.token_type}
              </Text>
              <Text style={styles.transactionDate}>
                {formatDate(item.created_at)}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
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
          <Text style={styles.loadingText}>Cargando movimientos... 📊</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0C0C0C" />
      
      {/* Header */}
      <LinearGradient
        colors={['#1E90FF', '#FF006E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Historial</Text>
          
          <View style={styles.headerRight}>
            <Text style={styles.totalTransactions}>
              {transactions.length} movimientos
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Transactions List */}
      <View style={styles.content}>
        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>Sin movimientos aún</Text>
            <Text style={styles.emptySubtitle}>
              Tus transacciones aparecerán aquí una vez que empieces a usar tu billetera
            </Text>
          </View>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id}
            renderItem={renderTransaction}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
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
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  totalTransactions: {
    fontSize: 14,
    color: '#AAAAAA',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  transactionCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  transactionGradient: {
    padding: 16,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  transactionAddress: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#AAAAAA',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 24,
  },
});