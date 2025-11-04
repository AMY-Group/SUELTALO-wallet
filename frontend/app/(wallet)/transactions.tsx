import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WalletService } from '../../services/WalletService';
import { HistoryService, TransactionHistoryItem } from '../../services/history';

export default function TransactionsScreen() {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    loadData();
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };

  const loadData = async () => {
    try {
      const wallet = await WalletService.getStoredWalletData();
      if (!wallet) {
        router.replace('/');
        return;
      }
      
      setWalletAddress(wallet.publicKey);
      
      // Load transaction history
      const history = await HistoryService.getTransactionHistory(wallet.publicKey, 20);
      setTransactions(history);
      
    } catch (error) {
      console.error('Error loading transactions:', error);
      Alert.alert('Error', 'No pudimos cargar tu historial');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleTxPress = (signature: string) => {
    const explorerUrl = HistoryService.getExplorerUrl(signature, 'devnet');
    Linking.openURL(explorerUrl);
  };

  const formatTimestamp = (timestamp: number): string => {
    if (!timestamp) return 'Desconocido';
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
  };

  const formatAddress = (address: string): string => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
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
          <Text style={styles.loadingText}>Cargando historial... 📋</Text>
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
          
          <Text style={styles.headerTitle}>Historial 📋</Text>
          
          <View style={styles.backButton} />
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {transactions.length === 0 ? (
          <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>No hay transacciones aún</Text>
            <Text style={styles.emptyDescription}>
              Cuando mandes o recibas tokens, aparecerán aquí
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => router.push('/send')}
            >
              <LinearGradient
                colors={['#1E90FF', '#00BFFF']}
                style={styles.emptyButtonGradient}
              >
                <Text style={styles.emptyButtonText}>Hacer primera transacción</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View style={[styles.transactionsSection, { opacity: fadeAnim }]}>
            <Text style={styles.sectionTitle}>
              {transactions.length} {transactions.length === 1 ? 'transacción' : 'transacciones'}
            </Text>
            
            <View style={styles.transactionsList}>
              {transactions.map((tx, index) => (
                <TouchableOpacity
                  key={tx.signature}
                  style={styles.transactionItem}
                  onPress={() => handleTxPress(tx.signature)}
                >
                  <LinearGradient
                    colors={
                      tx.status === 'failed'
                        ? ['rgba(255, 0, 0, 0.2)', 'rgba(255, 0, 0, 0.1)']
                        : tx.type === 'send'
                        ? ['rgba(30, 144, 255, 0.2)', 'rgba(30, 144, 255, 0.1)']
                        : ['rgba(0, 255, 136, 0.2)', 'rgba(0, 255, 136, 0.1)']
                    }
                    style={styles.transactionGradient}
                  >
                    <View style={styles.transactionMain}>
                      <View style={styles.transactionIcon}>
                        <Text style={styles.transactionEmoji}>
                          {tx.status === 'failed' ? '❌' : tx.type === 'send' ? '↗️' : '↙️'}
                        </Text>
                      </View>
                      
                      <View style={styles.transactionDetails}>
                        <Text style={styles.transactionType}>
                          {tx.status === 'failed' 
                            ? 'Falló' 
                            : tx.type === 'send' 
                            ? 'Enviaste' 
                            : tx.type === 'receive'
                            ? 'Recibiste'
                            : 'Otra'}
                        </Text>
                        <Text style={styles.transactionAddress}>
                          {tx.type === 'send' ? 'Para: ' : 'De: '}
                          {formatAddress(tx.counterparty)}
                        </Text>
                        <Text style={styles.transactionTime}>{formatTimestamp(tx.timestamp)}</Text>
                      </View>
                      
                      <View style={styles.transactionAmount}>
                        <Text style={[
                          styles.transactionValue,
                          tx.type === 'send' && styles.transactionValueSent,
                          tx.type === 'receive' && styles.transactionValueReceived,
                        ]}>
                          {tx.type === 'send' ? '-' : '+'}{tx.amount.toFixed(4)}
                        </Text>
                        <Text style={styles.transactionToken}>{tx.token}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.transactionFooter}>
                      <Text style={styles.transactionSignature}>
                        {formatAddress(tx.signature)}
                      </Text>
                      <View style={[
                        styles.transactionStatus,
                        tx.status === 'failed' && styles.transactionStatusFailed,
                      ]}>
                        <Text style={styles.transactionStatusText}>
                          {tx.status === 'failed' ? 'Falló' : 'Confirmado'}
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0C0C0C' },
  loadingContainer: { flex: 1, backgroundColor: '#0C0C0C' },
  gradientOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  gradientHeader: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255, 255, 255, 0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 24, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1 },
  scrollContainer: { flex: 1, paddingHorizontal: 20 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100 },
  emptyEmoji: { fontSize: 80, marginBottom: 20 },
  emptyTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 12, letterSpacing: 0.5 },
  emptyDescription: { fontSize: 16, color: '#AAAAAA', textAlign: 'center', marginBottom: 30, lineHeight: 24, paddingHorizontal: 40 },
  emptyButton: { borderRadius: 16, overflow: 'hidden' },
  emptyButtonGradient: { paddingVertical: 16, paddingHorizontal: 32 },
  emptyButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  transactionsSection: { marginVertical: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#AAAAAA', marginBottom: 16, letterSpacing: 0.5 },
  transactionsList: { gap: 12 },
  transactionItem: { borderRadius: 16, overflow: 'hidden' },
  transactionGradient: { padding: 16 },
  transactionMain: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  transactionIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255, 255, 255, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  transactionEmoji: { fontSize: 24 },
  transactionDetails: { flex: 1 },
  transactionType: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  transactionAddress: { fontSize: 12, color: '#AAAAAA', fontFamily: 'monospace', marginBottom: 2 },
  transactionTime: { fontSize: 12, color: '#AAAAAA' },
  transactionAmount: { alignItems: 'flex-end' },
  transactionValue: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
  transactionValueSent: { color: '#FF006E' },
  transactionValueReceived: { color: '#00FF88' },
  transactionToken: { fontSize: 12, color: '#AAAAAA', marginTop: 2 },
  transactionFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.1)' },
  transactionSignature: { fontSize: 11, color: '#AAAAAA', fontFamily: 'monospace' },
  transactionStatus: { backgroundColor: 'rgba(0, 255, 136, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  transactionStatusFailed: { backgroundColor: 'rgba(255, 0, 0, 0.2)' },
  transactionStatusText: { fontSize: 10, color: '#00FF88', fontWeight: '700' },
});
