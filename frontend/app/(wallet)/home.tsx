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
import * as SecureStore from 'expo-secure-store';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import Constants from 'expo-constants';
import { WalletService } from '../../services/WalletService';
import { ApiService } from '../../services/ApiService';
import { ErrorBoundary } from '../../components/ErrorBoundary';

const { width } = Dimensions.get('window');

interface Balance {
  SOL: number;
  USDC: number;
  SLT: number | null;
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
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balances, setBalances] = useState<Balance>({ SOL: 0, USDC: 0, SLT: null });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('inicio');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showWalletCTA, setShowWalletCTA] = useState(false);
  const fadeAnim = new Animated.Value(0);
  const bounceAnim = new Animated.Value(0.9);
  const glowAnim = new Animated.Value(0);

  // Solana connection
  const connection = new Connection(
    Constants.expoConfig?.extra?.EXPO_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com'
  );

  // Constants from environment
  const USDC_MINT = Constants.expoConfig?.extra?.EXPO_PUBLIC_USDC_MINT || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
  const SLT_MINT = Constants.expoConfig?.extra?.EXPO_PUBLIC_SLT_MINT;

  useEffect(() => {
    console.info('DASHBOARD_RENDER_OK');
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
      Animated.spring(bounceAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  };

  const loadWalletData = async () => {
    try {
      // Read pubkey from SecureStore
      const storedSecret = await SecureStore.getItemAsync('secret');
      const storedPublicKey = await SecureStore.getItemAsync('publicKey');
      
      if (!storedSecret || !storedPublicKey) {
        console.log('No wallet found in SecureStore, showing CTA');
        setShowWalletCTA(true);
        setLoading(false);
        return;
      }
      
      setPublicKey(storedPublicKey);
      await loadDevnetBalances(storedPublicKey);
      setLastUpdated(new Date());
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

  const handleTransactions = () => {
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
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0C0C0C" />
        
        {/* Fixed Height Gradient Header */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#1E90FF', '#FF006E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientHeader}
          >
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.appName}>SUÉLTALO</Text>
                <Text style={styles.tagline}>Tu lana, sin fronteras 🌎</Text>
              </View>
              
              <TouchableOpacity style={styles.profileButton}>
                <Text style={styles.addressText}>{formatAddress(walletData?.publicKey)}</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.contentContainer}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          >
            {/* NEON GLOWING BALANCE CARDS */}
            <Animated.View style={[styles.balancesSection, { opacity: fadeAnim, transform: [{ scale: bounceAnim }] }]}>
              <Text style={styles.sectionTitle}>Tu Lana 💰</Text>
              
              {/* USDC Card - Electric Blue Glow */}
              <Animated.View style={[styles.neonCard, styles.usdcCard]}>
                <LinearGradient
                  colors={['rgba(30, 144, 255, 0.3)', 'rgba(30, 144, 255, 0.1)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardGradient}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardIcon}>
                      <Text style={styles.cardEmoji}>💵</Text>
                    </View>
                    <Text style={styles.cardTitle}>USDC</Text>
                  </View>
                  <Text style={styles.cardAmount}>${formatAmount(balances.USDC, 2)}</Text>
                  <Text style={styles.cardSubtitle}>Tu lana digital</Text>
                </LinearGradient>
              </Animated.View>

              {/* SLT Card - Neon Magenta Glow */}
              <Animated.View style={[styles.neonCard, styles.sltCard]}>
                <LinearGradient
                  colors={['rgba(255, 0, 110, 0.3)', 'rgba(255, 0, 110, 0.1)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardGradient}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardIcon}>
                      <Text style={styles.cardEmoji}>🎁</Text>
                    </View>
                    <Text style={styles.cardTitle}>SLT</Text>
                  </View>
                  <Text style={styles.cardAmount}>{formatAmount(balances.SLT)}</Text>
                  <Text style={styles.cardSubtitle}>Premios ganados</Text>
                </LinearGradient>
              </Animated.View>

              {/* SOL Card - Neon Green Glow */}
              <Animated.View style={[styles.neonCard, styles.solCard]}>
                <LinearGradient
                  colors={['rgba(0, 255, 136, 0.3)', 'rgba(0, 255, 136, 0.1)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardGradient}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardIcon}>
                      <Text style={styles.cardEmoji}>⚡</Text>
                    </View>
                    <Text style={styles.cardTitle}>SOL</Text>
                  </View>
                  <Text style={styles.cardAmount}>{formatAmount(balances.SOL)}</Text>
                  <Text style={styles.cardSubtitle}>Para los fees</Text>
                </LinearGradient>
              </Animated.View>
            </Animated.View>

            {/* Big Neon Action Buttons */}
            <Animated.View style={[styles.actionsSection, { opacity: fadeAnim }]}>
              <TouchableOpacity style={styles.bigActionButton} onPress={handleSend}>
                <LinearGradient
                  colors={['#1E90FF', '#00BFFF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.bigButtonGradient}
                >
                  <Text style={styles.bigButtonEmoji}>💸</Text>
                  <Text style={styles.bigButtonText}>Enviar</Text>
                  <Text style={styles.bigButtonSubtext}>Manda lana al toque</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.bigActionButton} onPress={handleReceive}>
                <LinearGradient
                  colors={['#FF006E', '#FF4081']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.bigButtonGradient}
                >
                  <Text style={styles.bigButtonEmoji}>📥</Text>
                  <Text style={styles.bigButtonText}>Recibir</Text>
                  <Text style={styles.bigButtonSubtext}>Cobra sin broncas</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.bigActionButton} onPress={handleRewards}>
                <LinearGradient
                  colors={['#00FF88', '#4CAF50']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.bigButtonGradient}
                >
                  <Text style={styles.bigButtonEmoji}>🎉</Text>
                  <Text style={styles.bigButtonText}>Rewards</Text>
                  <Text style={styles.bigButtonSubtext}>Gana premios SLT</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Recent Activity */}
            {transactions.length > 0 && (
              <Animated.View style={[styles.activitySection, { opacity: fadeAnim }]}>
                <View style={styles.activityHeader}>
                  <Text style={styles.sectionTitle}>Movimientos Recientes</Text>
                  <TouchableOpacity onPress={handleTransactions}>
                    <Text style={styles.viewAllText}>Ver todo</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.quickActivity}>
                  {transactions.slice(0, 3).map((tx, index) => (
                    <View key={tx.id} style={styles.activityItem}>
                      <View style={styles.activityIcon}>
                        <Text style={styles.activityEmoji}>
                          {tx.from_address === walletData?.publicKey ? '↗️' : '↙️'}
                        </Text>
                      </View>
                      <View style={styles.activityDetails}>
                        <Text style={styles.activityType}>
                          {tx.from_address === walletData?.publicKey ? 'Mandaste' : 'Te llegó'} {tx.token_type}
                        </Text>
                        <Text style={styles.activityAmount}>
                          {tx.from_address === walletData?.publicKey ? '-' : '+'}
                          {formatAmount(tx.amount)} {tx.token_type}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}
          </ScrollView>
        </View>

        {/* Bottom Navigation with Neon Icons */}
        <View style={styles.bottomNav}>
          <LinearGradient
            colors={['rgba(12, 12, 12, 0.95)', 'rgba(30, 30, 30, 0.95)']}
            style={styles.bottomNavGradient}
          >
            <TouchableOpacity 
              style={[styles.navButton, activeTab === 'inicio' && styles.activeNavButton]} 
              onPress={() => setActiveTab('inicio')}
            >
              <Text style={styles.navIcon}>🏠</Text>
              <Text style={[styles.navText, activeTab === 'inicio' && styles.activeNavText]}>
                Inicio
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.navButton, activeTab === 'historial' && styles.activeNavButton]} 
              onPress={() => {
                setActiveTab('historial');
                handleTransactions();
              }}
            >
              <Text style={styles.navIcon}>📋</Text>
              <Text style={[styles.navText, activeTab === 'historial' && styles.activeNavText]}>
                Historial
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.navButton, activeTab === 'config' && styles.activeNavButton]} 
              onPress={() => {
                setActiveTab('config');
                handleSettings();
              }}
            >
              <Text style={styles.navIcon}>⚙️</Text>
              <Text style={[styles.navText, activeTab === 'config' && styles.activeNavText]}>
                Config
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0C0C',
  },
  contentContainer: {
    flex: 1,
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
  headerContainer: {
    height: 140,
  },
  gradientHeader: {
    flex: 1,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
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
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 3,
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 14,
    color: '#AAAAAA',
    marginTop: 4,
    letterSpacing: 1,
  },
  profileButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addressText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  balancesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 24,
    letterSpacing: 1,
    textAlign: 'center',
  },
  neonCard: {
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 20,
  },
  usdcCard: {
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    borderWidth: 2,
    borderColor: '#1E90FF',
  },
  sltCard: {
    shadowColor: '#FF006E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    borderWidth: 2,
    borderColor: '#FF006E',
  },
  solCard: {
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    borderWidth: 2,
    borderColor: '#00FF88',
  },
  cardGradient: {
    padding: 28,
    borderRadius: 22,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardEmoji: {
    fontSize: 24,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  cardAmount: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 1,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  actionsSection: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 30,
  },
  bigActionButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  bigButtonGradient: {
    paddingVertical: 24,
    paddingHorizontal: 28,
    alignItems: 'center',
    flexDirection: 'row',
  },
  bigButtonEmoji: {
    fontSize: 32,
    marginRight: 20,
  },
  bigButtonText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    flex: 1,
  },
  bigButtonSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  activitySection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    color: '#1E90FF',
    fontSize: 14,
    fontWeight: '700',
  },
  quickActivity: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityType: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  activityAmount: {
    color: '#AAAAAA',
    fontSize: 12,
    fontWeight: '500',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  bottomNavGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 20,
    paddingTop: 16,
  },
  navButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  activeNavButton: {
    backgroundColor: 'rgba(30, 144, 255, 0.1)',
  },
  navText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    color: '#666666',
  },
  activeNavText: {
    color: '#FFFFFF',
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  activityEmoji: {
    fontSize: 18,
  },
});