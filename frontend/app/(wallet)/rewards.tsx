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
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WalletService } from '../../services/WalletService';
import { ApiService } from '../../services/ApiService';

const { width, height } = Dimensions.get('window');

interface RewardBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  earned: boolean;
  requirement: string;
}

export default function RewardsScreen() {
  const router = useRouter();
  const [walletData, setWalletData] = useState<any>(null);
  const [sltBalance, setSltBalance] = useState(0);
  const [totalRewards, setTotalRewards] = useState(0);
  const [level, setLevel] = useState(1);
  const [nextLevelProgress, setNextLevelProgress] = useState(0.3);
  
  const fadeAnim = new Animated.Value(0);
  const bounceAnim = new Animated.Value(0.8);
  const confettiAnim = new Animated.Value(0);

  const badges: RewardBadge[] = [
    {
      id: '1',
      title: 'Primera Transacción',
      description: 'Hiciste tu primer envío',
      icon: '🚀',
      color: '#1E90FF',
      earned: true,
      requirement: '1 transacción'
    },
    {
      id: '2',
      title: 'Crypto Novato',
      description: 'Completaste 5 transacciones',
      icon: '⭐',
      color: '#00FF88',
      earned: true,
      requirement: '5 transacciones'
    },
    {
      id: '3',
      title: 'Hodler',
      description: 'Mantuviste crypto por 30 días',
      icon: '💎',
      color: '#FF006E',
      earned: false,
      requirement: '30 días holding'
    },
    {
      id: '4',
      title: 'Ballena',
      description: 'Transacción de +$1000',
      icon: '🐋',
      color: '#9945FF',
      earned: false,
      requirement: '$1000+ en una tx'
    },
    {
      id: '5',
      title: 'Referidor Pro',
      description: 'Invitaste 10 amigos',
      icon: '🎯',
      color: '#FF6B35',
      earned: false,
      requirement: '10 referidos'
    },
    {
      id: '6',
      title: 'SLT Collector',
      description: 'Acumulaste 100 SLT',
      icon: '🏆',
      color: '#FFD700',
      earned: false,
      requirement: '100 SLT tokens'
    }
  ];

  useEffect(() => {
    loadRewardsData();
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
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
          Animated.timing(confettiAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(confettiAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  };

  const loadRewardsData = async () => {
    try {
      const wallet = await WalletService.getStoredWalletData();
      if (!wallet) {
        router.replace('/');
        return;
      }
      
      setWalletData(wallet);
      
      // Load SLT balance
      const balanceData = await ApiService.getWalletBalance(wallet.publicKey);
      setSltBalance(balanceData.balances.SLT);
      
      // Calculate total rewards earned
      const transactions = await ApiService.getTransactions(wallet.publicKey);
      const totalSLTEarned = transactions
        .filter((tx: any) => tx.reward_slt > 0)
        .reduce((sum: number, tx: any) => sum + tx.reward_slt, 0);
      
      setTotalRewards(totalSLTEarned);
      
      // Calculate level (every 50 SLT = 1 level)
      const currentLevel = Math.floor(balanceData.balances.SLT / 50) + 1;
      setLevel(currentLevel);
      
      // Progress to next level
      const progressToNext = (balanceData.balances.SLT % 50) / 50;
      setNextLevelProgress(progressToNext);
      
    } catch (error) {
      console.error('Error loading rewards data:', error);
    }
  };

  const handleClaimReward = () => {
    // Bounce animation for claiming
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const renderBadge = (badge: RewardBadge, index: number) => (
    <Animated.View
      key={badge.id}
      style={[
        styles.badgeContainer,
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
        colors={badge.earned 
          ? [badge.color + '40', badge.color + '20']
          : ['rgba(170, 170, 170, 0.1)', 'rgba(170, 170, 170, 0.05)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.badgeGradient, !badge.earned && styles.badgeDisabled]}
      >
        <View style={styles.badgeContent}>
          <View style={[styles.badgeIcon, { backgroundColor: badge.earned ? badge.color + '20' : '#333333' }]}>
            <Text style={styles.badgeEmoji}>{badge.icon}</Text>
          </View>
          
          <View style={styles.badgeInfo}>
            <Text style={[styles.badgeTitle, !badge.earned && styles.disabledText]}>
              {badge.title}
            </Text>
            <Text style={[styles.badgeDescription, !badge.earned && styles.disabledText]}>
              {badge.description}
            </Text>
            <Text style={styles.badgeRequirement}>
              {badge.requirement}
            </Text>
          </View>
          
          {badge.earned && (
            <View style={styles.badgeCheck}>
              <Ionicons name="checkmark-circle" size={24} color={badge.color} />
            </View>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );

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
          
          <Text style={styles.headerTitle}>Recompensas SLT</Text>
          
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Lvl {level}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Reward Stats */}
        <Animated.View style={[styles.statsSection, { opacity: fadeAnim, transform: [{ scale: bounceAnim }] }]}>
          <LinearGradient
            colors={['rgba(30, 144, 255, 0.2)', 'rgba(255, 0, 110, 0.2)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statsGradient}
          >
            <View style={styles.statsContent}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{sltBalance.toFixed(2)}</Text>
                <Text style={styles.statLabel}>SLT Balance</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalRewards.toFixed(2)}</Text>
                <Text style={styles.statLabel}>Total Ganado</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{level}</Text>
                <Text style={styles.statLabel}>Nivel Actual</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Level Progress */}
        <Animated.View style={[styles.progressSection, { opacity: fadeAnim }]}>
          <Text style={styles.progressTitle}>Progreso al Nivel {level + 1}</Text>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBg}>
              <Animated.View 
                style={[
                  styles.progressBarFill,
                  { 
                    width: `${nextLevelProgress * 100}%`,
                    opacity: fadeAnim 
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {Math.floor(nextLevelProgress * 50)}/50 SLT
            </Text>
          </View>
        </Animated.View>

        {/* Confetti Effect */}
        <Animated.View 
          style={[
            styles.confettiContainer,
            {
              opacity: confettiAnim,
              transform: [{
                translateY: confettiAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -100]
                })
              }]
            }
          ]}
        >
          <Text style={styles.confetti}>🎉 ✨ 🎊 ⭐ 🚀</Text>
        </Animated.View>

        {/* Achievement Badges */}
        <View style={styles.badgesSection}>
          <Text style={styles.sectionTitle}>Logros Desbloqueados</Text>
          <Text style={styles.sectionSubtitle}>Colecciona badges completando desafíos</Text>
          
          <View style={styles.badgesList}>
            {badges.map((badge, index) => renderBadge(badge, index))}
          </View>
        </View>

        {/* Call to Action */}
        <Animated.View style={[styles.ctaSection, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.ctaButton} onPress={handleClaimReward}>
            <LinearGradient
              colors={['#1E90FF', '#FF006E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Ionicons name="gift" size={24} color="#FFFFFF" style={styles.ctaIcon} />
              <Text style={styles.ctaText}>Hacer Transacción para Ganar SLT</Text>
            </LinearGradient>
          </TouchableOpacity>
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
  levelBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  levelText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  statsSection: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  statsGradient: {
    padding: 24,
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#AAAAAA',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#333333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00FF88',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#AAAAAA',
    textAlign: 'right',
    marginTop: 4,
  },
  confettiContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  confetti: {
    fontSize: 24,
    letterSpacing: 8,
  },
  badgesSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 1,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  badgesList: {
    gap: 16,
  },
  badgeContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  badgeGradient: {
    borderWidth: 1,
    borderColor: 'rgba(30, 144, 255, 0.3)',
  },
  badgeDisabled: {
    borderColor: '#333333',
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  badgeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  badgeEmoji: {
    fontSize: 24,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  badgeDescription: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 4,
  },
  badgeRequirement: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },
  disabledText: {
    color: '#666666',
  },
  badgeCheck: {
    marginLeft: 16,
  },
  ctaSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  ctaButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  ctaGradient: {
    paddingVertical: 20,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaIcon: {
    marginRight: 12,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});