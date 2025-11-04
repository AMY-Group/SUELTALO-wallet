import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, RefreshControl, Alert, StatusBar, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { WalletService } from '../../services/WalletService';
import { ApiService } from '../../services/ApiService';
import { ErrorBoundary } from '../../components/ErrorBoundary';

const { width } = Dimensions.get('window');

const defaultBalance = { SOL: 0, USDC: 0, SLT: 0 };

export default function DashboardScreen() {
  const router = useRouter();
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balances, setBalances] = useState(defaultBalance);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('inicio');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showWalletCTA, setShowWalletCTA] = useState(false);
  const fadeAnim = new Animated.Value(0);
  const bounceAnim = new Animated.Value(0.9);
  const glowAnim = new Animated.Value(0);

  useEffect(() => {
    loadWalletData();
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(bounceAnim, { toValue: 1, tension: 100, friction: 8, useNativeDriver: true }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ])
      ),
    ]).start();
  };

  const loadWalletData = async () => {
    try {
      const storedPublicKey = await SecureStore.getItemAsync('publicKey');
      if (!storedPublicKey) {
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

  const loadDevnetBalances = async (publicKeyString: string) => {
    try {
      const data = await ApiService.getDevnetBalance(publicKeyString);
      const newBalances = {
        SOL: data?.balances?.SOL ?? data?.sol_balance ?? 0,
        USDC: data?.balances?.USDC ?? data?.usdc_balance ?? 0,
        SLT: data?.balances?.SLT ?? data?.slt_balance ?? 0,
      };
      setBalances(newBalances);
    } catch (error) {
      console.error('Error loading Devnet balances:', error);
      Alert.alert('Error', 'No pudimos cargar los balances desde Devnet');
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (publicKey) {
      await loadDevnetBalances(publicKey);
      setLastUpdated(new Date());
    }
    setRefreshing(false);
  }, [publicKey]);

  const handleSend = () => router.push('/send');
  const handleReceive = () => router.push('/receive');
  const handleRewards = () => router.push('/rewards');
  const handleTransactions = () => router.push('/transactions');
  const handleSettings = () => router.push('/settings');

  const formatAddress = (address: string) => (address ? `${address.slice(0, 4)}...${address.slice(-4)}` : '');
  const formatAmount = (amount: number | null) => (amount ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  const getTimeAgo = (date: Date | null) => {
    if (!date) return '';
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return `Actualizado hace ${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `Actualizado hace ${Math.floor(diffInSeconds / 60)}m`;
    return `Actualizado hace ${Math.floor(diffInSeconds / 3600)}h`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LinearGradient colors={['#1E90FF', '#FF006E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientOverlay}>
          <Text style={styles.loadingText}>Cargando tu billetera...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (showWalletCTA) {
    return (
      <ErrorBoundary>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#0C0C0C" />
          <View style={styles.contentContainer}>
            <View style={styles.ctaContainer}>
              <Text style={styles.ctaEmoji}>💰</Text>
              <Text style={styles.ctaTitle}>¡Dale, empecemos!</Text>
              <Text style={styles.ctaSubtitle}>Necesitas crear o importar una billetera para ver tus balances</Text>
              <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/(onboarding)/create')} testID="onboarding-create-button">
                <LinearGradient colors={['#1E90FF', '#FF006E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientButton}>
                  <Text style={styles.ctaButtonText}>Crear mi billetera</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ctaSecondaryButton} onPress={() => router.push('/(onboarding)/import')} testID="onboarding-import-button">
                <Text style={styles.ctaSecondaryText}>Ya tengo una</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0C0C0C" />

        <View style={styles.headerContainer}>
          <LinearGradient colors={['#1E90FF', '#FF006E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientHeader}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.appName}>SUÉLTALO</Text>
                <Text style={styles.tagline}>Tu lana, sin fronteras 🌎</Text>
              </View>
              <View style={styles.headerRight}>
                <Text style={styles.addressText} testID="wallet-address-text">{formatAddress(publicKey || '')}</Text>
                {lastUpdated && <Text style={styles.updatedText} testID="last-updated-text">{getTimeAgo(lastUpdated)}</Text>}
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.contentContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} showsVerticalScrollIndicator={false}>
            <Animated.View style={[styles.balancesSection, { opacity: fadeAnim, transform: [{ scale: bounceAnim }] }]}>
              <Text style={styles.sectionTitle}>Tu Lana 💰</Text>

              <Animated.View style={[styles.neonCard, styles.usdcCard]} testID="balance-usdc-card">
                <LinearGradient colors={['rgba(30, 144, 255, 0.3)', 'rgba(30, 144, 255, 0.1)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardGradient}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardIcon}><Text style={styles.cardEmoji}>💵</Text></View>
                    <Text style={styles.cardTitle}>USDC</Text>
                  </View>
                  <Text style={styles.cardAmount} testID="balance-usdc-amount">${formatAmount(balances.USDC)}</Text>
                  <Text style={styles.cardSubtitle}>Tu lana digital</Text>
                </LinearGradient>
              </Animated.View>

              <Animated.View style={[styles.neonCard, styles.sltCard]} testID="balance-slt-card">
                <LinearGradient colors={['rgba(255, 0, 110, 0.3)', 'rgba(255, 0, 110, 0.1)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardGradient}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardIcon}><Text style={styles.cardEmoji}>🎁</Text></View>
                    <Text style={styles.cardTitle}>SLT</Text>
                  </View>
                  <Text style={styles.cardAmount} testID="balance-slt-amount">{formatAmount(balances.SLT)}</Text>
                  <Text style={styles.cardSubtitle}>Premios ganados</Text>
                </LinearGradient>
              </Animated.View>

              <Animated.View style={[styles.neonCard, styles.solCard]} testID="balance-sol-card">
                <LinearGradient colors={['rgba(0, 255, 136, 0.3)', 'rgba(0, 255, 136, 0.1)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardGradient}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardIcon}><Text style={styles.cardEmoji}>⚡</Text></View>
                    <Text style={styles.cardTitle}>SOL</Text>
                  </View>
                  <Text style={styles.cardAmount} testID="balance-sol-amount">{formatAmount(balances.SOL)}</Text>
                  <Text style={styles.cardSubtitle}>Para los fees</Text>
                </LinearGradient>
              </Animated.View>
            </Animated.View>

            <Animated.View style={[styles.actionsSection, { opacity: fadeAnim }]}> 
              {balances.SOL < 0.01 && (
                <TouchableOpacity style={styles.bigActionButton} onPress={() => Alert.alert('Airdrop', 'Ve a la sección de airdrop desde Rewards')} testID="request-sol-airdrop-button">
                  <LinearGradient colors={['#9945FF', '#BB86FC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bigButtonGradient}>
                    <Text style={styles.bigButtonEmoji}>⚡</Text>
                    <Text style={styles.bigButtonText}>Obtener SOL</Text>
                    <Text style={styles.bigButtonSubtext}>Para fees en Devnet</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.bigActionButton} onPress={handleSend} testID="send-button">
                <LinearGradient colors={['#1E90FF', '#00BFFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bigButtonGradient}>
                  <Text style={styles.bigButtonEmoji}>💸</Text>
                  <Text style={styles.bigButtonText}>Enviar</Text>
                  <Text style={styles.bigButtonSubtext}>Manda lana al toque</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.bigActionButton} onPress={handleReceive} testID="receive-button">
                <LinearGradient colors={['#FF006E', '#FF4081']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bigButtonGradient}>
                  <Text style={styles.bigButtonEmoji}>📥</Text>
                  <Text style={styles.bigButtonText}>Recibir</Text>
                  <Text style={styles.bigButtonSubtext}>Cobra sin broncas</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.bigActionButton} onPress={handleRewards} testID="rewards-button">
                <LinearGradient colors={['#00FF88', '#4CAF50']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bigButtonGradient}>
                  <Text style={styles.bigButtonEmoji}>🎉</Text>
                  <Text style={styles.bigButtonText}>Rewards</Text>
                  <Text style={styles.bigButtonSubtext}>Gana premios SLT</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {transactions.length > 0 && (
              <Animated.View style={[styles.activitySection, { opacity: fadeAnim }]}>
                <View style={styles.activityHeader}>
                  <Text style={styles.sectionTitle}>Movimientos Recientes</Text>
                  <TouchableOpacity onPress={handleTransactions} testID="view-all-transactions-button">
                    <Text style={styles.viewAllText}>Ver todo</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}
          </ScrollView>
        </View>

        <View style={styles.bottomNav}>
          <LinearGradient colors={['rgba(12, 12, 12, 0.95)', 'rgba(30, 30, 30, 0.95)']} style={styles.bottomNavGradient}>
            <TouchableOpacity style={[styles.navButton, activeTab === 'inicio' && styles.activeNavButton]} onPress={() => setActiveTab('inicio')} testID="tab-inicio">
              <Text style={styles.navIcon}>🏠</Text>
              <Text style={[styles.navText, activeTab === 'inicio' && styles.activeNavText]}>Inicio</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.navButton, activeTab === 'historial' && styles.activeNavButton]} onPress={() => { setActiveTab('historial'); handleTransactions(); }} testID="tab-historial">
              <Text style={styles.navIcon}>📋</Text>
              <Text style={[styles.navText, activeTab === 'historial' && styles.activeNavText]}>Historial</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.navButton, activeTab === 'config' && styles.activeNavButton]} onPress={() => { setActiveTab('config'); handleSettings(); }} testID="tab-config">
              <Text style={styles.navIcon}>⚙️</Text>
              <Text style={[styles.navText, activeTab === 'config' && styles.activeNavText]}>Config</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0C0C0C' },
  contentContainer: { flex: 1 },
  loadingContainer: { flex: 1, backgroundColor: '#0C0C0C' },
  gradientOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', letterSpacing: 1 },
  headerContainer: { height: 140 },
  gradientHeader: { flex: 1, paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flex: 1 },
  appName: { fontSize: 32, fontWeight: '900', color: '#FFFFFF', letterSpacing: 3, textShadowColor: '#000000', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 4 },
  tagline: { fontSize: 14, color: '#AAAAAA', marginTop: 4, letterSpacing: 1 },
  addressText: { color: '#FFFFFF', fontSize: 12, fontFamily: 'monospace', fontWeight: '600' },
  scrollContent: { paddingBottom: 40 },
  balancesSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 28, fontWeight: '900', color: '#FFFFFF', marginBottom: 24, letterSpacing: 1, textAlign: 'center' },
  neonCard: { borderRadius: 24, marginBottom: 20, shadowColor: '#1E90FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 20, elevation: 20 },
  usdcCard: { shadowColor: '#1E90FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 20, borderWidth: 2, borderColor: '#1E90FF' },
  sltCard: { shadowColor: '#FF006E', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 20, borderWidth: 2, borderColor: '#FF006E' },
  solCard: { shadowColor: '#00FF88', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 20, borderWidth: 2, borderColor: '#00FF88' },
  cardGradient: { padding: 28, borderRadius: 22 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255, 255, 255, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardEmoji: { fontSize: 24 },
  cardTitle: { fontSize: 24, fontWeight: '900', color: '#FFFFFF', letterSpacing: 2 },
  cardAmount: { fontSize: 42, fontWeight: '900', color: '#FFFFFF', marginBottom: 8, letterSpacing: 1, textAlign: 'center' },
  cardSubtitle: { fontSize: 16, color: '#AAAAAA', textAlign: 'center', letterSpacing: 0.5, fontWeight: '600' },
  actionsSection: { paddingHorizontal: 20, gap: 16, marginBottom: 30 },
  bigActionButton: { borderRadius: 20, overflow: 'hidden', shadowColor: '#1E90FF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 16 },
  bigButtonGradient: { paddingVertical: 24, paddingHorizontal: 28, alignItems: 'center', flexDirection: 'row' },
  bigButtonEmoji: { fontSize: 32, marginRight: 20 },
  bigButtonText: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1, flex: 1 },
  bigButtonSubtext: { fontSize: 12, color: 'rgba(255, 255, 255, 0.8)', fontWeight: '600' },
  activitySection: { paddingHorizontal: 20, marginBottom: 30 },
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  viewAllText: { color: '#1E90FF', fontSize: 14, fontWeight: '700' },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 90, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.1)' },
  bottomNavGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingBottom: 20, paddingTop: 16 },
  navButton: { alignItems: 'center', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 16 },
  activeNavButton: { backgroundColor: 'rgba(30, 144, 255, 0.1)' },
  navText: { fontSize: 12, fontWeight: '600', marginTop: 4, color: '#666666' },
  activeNavText: { color: '#FFFFFF' },
  navIcon: { fontSize: 20, marginBottom: 4 },
  ctaContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  ctaEmoji: { fontSize: 64, marginBottom: 20 },
  ctaTitle: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', marginBottom: 12, letterSpacing: 0.5 },
  ctaSubtitle: { fontSize: 16, color: '#AAAAAA', textAlign: 'center', marginBottom: 40, lineHeight: 24 },
  ctaButton: { width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  gradientButton: { paddingVertical: 20, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center' },
  ctaButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },
  ctaSecondaryButton: { width: '100%', borderRadius: 16, borderWidth: 2, borderColor: '#1E90FF', paddingVertical: 20, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center' },
  ctaSecondaryText: { color: '#1E90FF', fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },
  headerRight: { alignItems: 'flex-end' },
  updatedText: { fontSize: 12, color: '#AAAAAA', marginTop: 4 },
});
