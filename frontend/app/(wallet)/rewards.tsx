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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WalletService } from '../../services/WalletService';
import Constants from 'expo-constants';

interface AirdropStat {
  address: string;
  date: string;
  total_received_today: number;
  remaining_today: number;
  cap_per_day: number;
  max_per_transaction: number;
}

export default function RewardsScreen() {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [sltBalance, setSltBalance] = useState(0);
  const [airdropStats, setAirdropStats] = useState<AirdropStat | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const fadeAnim = new Animated.Value(0);
  const bounceAnim = new Animated.Value(0.8);

  useEffect(() => {
    loadData();
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
        tension: 80,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadData = async () => {
    try {
      const wallet = await WalletService.getStoredWalletData();
      if (!wallet) {
        router.replace('/');
        return;
      }
      
      setWalletAddress(wallet.publicKey);
      
      const backendUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;
      const balanceResponse = await fetch(`${backendUrl}/api/devnet/balance/${wallet.publicKey}`);
      const balanceData = await balanceResponse.json();
      setSltBalance(balanceData.slt_balance || 0);
      
      const statsResponse = await fetch(`${backendUrl}/api/devnet/airdrop-stats/${wallet.publicKey}`);
      const statsData = await statsResponse.json();
      setAirdropStats(statsData);
      
    } catch (error) {
      console.error('Error loading rewards data:', error);
      Alert.alert('Error', 'No pudimos cargar tus rewards');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const progressPercent = airdropStats 
    ? ((airdropStats.total_received_today / airdropStats.cap_per_day) * 100)
    : 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LinearGradient
          colors={['#00FF88', '#1E90FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientOverlay}
        >
          <Text style={styles.loadingText}>Cargando tus rewards... 🎁</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0C0C0C" />
      
      <LinearGradient
        colors={['#00FF88', '#1E90FF']}
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
          
          <Text style={styles.headerTitle}>Rewards SLT 🎉</Text>
          
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
        <Animated.View style={[styles.balanceSection, { opacity: fadeAnim, transform: [{ scale: bounceAnim }] }]}>
          <LinearGradient
            colors={['rgba(0, 255, 136, 0.3)', 'rgba(0, 255, 136, 0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <Text style={styles.balanceLabel}>💰 Tu Balance SLT</Text>
            <Text style={styles.balanceAmount}>{sltBalance.toFixed(2)}</Text>
            <Text style={styles.balanceSubtitle}>SUÉLTALO Tokens</Text>
          </LinearGradient>
        </Animated.View>

        <Animated.View style={[styles.progressSection, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>📊 Tu progreso hoy</Text>
          
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
            style={styles.progressCard}
          >
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>SLT recibido hoy:</Text>
              <Text style={styles.progressValue}>{airdropStats?.total_received_today.toFixed(2) || '0.00'} SLT</Text>
            </View>
            
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Quedan hoy:</Text>
              <Text style={styles.progressValue}>{airdropStats?.remaining_today.toFixed(2) || '0.00'} SLT</Text>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
              </View>
              <Text style={styles.progressPercent}>{progressPercent.toFixed(0)}%</Text>
            </View>
            
            <View style={styles.limitsRow}>
              <View style={styles.limitItem}>
                <Text style={styles.limitLabel}>💸 Límite diario</Text>
                <Text style={styles.limitValue}>{airdropStats?.cap_per_day || 100} SLT</Text>
              </View>
              <View style={styles.limitItem}>
                <Text style={styles.limitLabel}>🎁 Máx por TX</Text>
                <Text style={styles.limitValue}>{airdropStats?.max_per_transaction || 10} SLT</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View style={[styles.howToSection, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>💡 ¿Cómo ganar SLT?</Text>
          
          <View style={styles.howToList}>
            <LinearGradient
              colors={['rgba(30, 144, 255, 0.2)', 'rgba(30, 144, 255, 0.1)']}
              style={styles.howToItem}
            >
              <View style={styles.howToIcon}>
                <Text style={styles.howToEmoji}>💸</Text>
              </View>
              <View style={styles.howToContent}>
                <Text style={styles.howToTitle}>Envía USDC-MOCK</Text>
                <Text style={styles.howToDescription}>
                  Por cada 1.0 USDC que mandes, recibes 0.1 SLT automáticamente
                </Text>
              </View>
            </LinearGradient>

            <LinearGradient
              colors={['rgba(255, 0, 110, 0.2)', 'rgba(255, 0, 110, 0.1)']}
              style={styles.howToItem}
            >
              <View style={styles.howToIcon}>
                <Text style={styles.howToEmoji}>⚡</Text>
              </View>
              <View style={styles.howToContent}>
                <Text style={styles.howToTitle}>Límites diarios</Text>
                <Text style={styles.howToDescription}>
                  Máximo {airdropStats?.cap_per_day || 100} SLT por día, {airdropStats?.max_per_transaction || 10} SLT por transacción
                </Text>
              </View>
            </LinearGradient>

            <LinearGradient
              colors={['rgba(0, 255, 136, 0.2)', 'rgba(0, 255, 136, 0.1)']}
              style={styles.howToItem}
            >
              <View style={styles.howToIcon}>
                <Text style={styles.howToEmoji}>🔒</Text>
              </View>
              <View style={styles.howToContent}>
                <Text style={styles.howToTitle}>Automático y seguro</Text>
                <Text style={styles.howToDescription}>
                  Los rewards llegan automáticamente después de cada transacción verificada
                </Text>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        <Animated.View style={[styles.actionSection, { opacity: fadeAnim }]}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/send')}
          >
            <LinearGradient
              colors={['#00FF88', '#4CAF50']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionGradient}
            >
              <Ionicons name="send" size={24} color="#FFFFFF" style={styles.actionIcon} />
              <Text style={styles.actionText}>Mandar USDC y ganar SLT</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
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
  balanceSection: { marginVertical: 30, alignItems: 'center' },
  balanceCard: { width: '100%', padding: 40, borderRadius: 24, alignItems: 'center', borderWidth: 2, borderColor: '#00FF88' },
  balanceLabel: { fontSize: 18, color: '#AAAAAA', marginBottom: 12, fontWeight: '600' },
  balanceAmount: { fontSize: 64, fontWeight: '900', color: '#FFFFFF', marginBottom: 8, letterSpacing: 2 },
  balanceSubtitle: { fontSize: 16, color: '#00FF88', fontWeight: '700', letterSpacing: 1 },
  progressSection: { marginBottom: 30 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 16, letterSpacing: 0.5 },
  progressCard: { padding: 24, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  progressLabel: { fontSize: 16, color: '#AAAAAA', fontWeight: '600' },
  progressValue: { fontSize: 16, color: '#FFFFFF', fontWeight: '700' },
  progressBarContainer: { marginVertical: 20 },
  progressBarBg: { height: 12, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 6, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#00FF88', borderRadius: 6 },
  progressPercent: { textAlign: 'center', marginTop: 8, fontSize: 14, color: '#00FF88', fontWeight: '700' },
  limitsRow: { flexDirection: 'row', marginTop: 16, gap: 12 },
  limitItem: { flex: 1, backgroundColor: 'rgba(0, 255, 136, 0.1)', padding: 16, borderRadius: 12, alignItems: 'center' },
  limitLabel: { fontSize: 12, color: '#AAAAAA', marginBottom: 4 },
  limitValue: { fontSize: 18, color: '#FFFFFF', fontWeight: '700' },
  howToSection: { marginBottom: 30 },
  howToList: { gap: 16 },
  howToItem: { flexDirection: 'row', padding: 20, borderRadius: 16, alignItems: 'center' },
  howToIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255, 255, 255, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  howToEmoji: { fontSize: 28 },
  howToContent: { flex: 1 },
  howToTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  howToDescription: { fontSize: 14, color: '#AAAAAA', lineHeight: 20 },
  actionSection: { marginBottom: 40 },
  actionButton: { borderRadius: 16, overflow: 'hidden' },
  actionGradient: { paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  actionIcon: { marginRight: 12 },
  actionText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },
});