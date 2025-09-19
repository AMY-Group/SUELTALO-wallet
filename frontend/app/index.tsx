import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  StatusBar,
  Dimensions,
  Animated,
  LinearGradient
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const [hasWallet, setHasWallet] = useState(false);
  const [loading, setLoading] = useState(true);
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    checkExistingWallet();
    
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const checkExistingWallet = async () => {
    try {
      const walletData = await AsyncStorage.getItem('@wallet_data');
      if (walletData) {
        setHasWallet(true);
        // Auto-navigate to dashboard if wallet exists
        setTimeout(() => {
          router.replace('/dashboard');
        }, 2000);
      } else {
        setHasWallet(false);
      }
    } catch (error) {
      console.error('Error checking wallet:', error);
      setHasWallet(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWallet = () => {
    router.push('/onboarding/create');
  };

  const handleImportWallet = () => {
    router.push('/onboarding/import');
  };

  const handleAccessWallet = () => {
    router.push('/dashboard');
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
          <View style={styles.loadingContent}>
            <Text style={styles.loadingText}>SUÉLTALO</Text>
            <Text style={styles.loadingSubtext}>Cargando...</Text>
          </View>
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
        <Animated.View style={[styles.headerContent, { opacity: fadeAnim }]}>
          <Text style={styles.appName}>SUÉLTALO</Text>
          <Text style={styles.tagline}>Billetera Cripto No-Custodial</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>SOLANA DEVNET</Text>
          </View>
        </Animated.View>
      </LinearGradient>

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        {/* Neon Wallet Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.neonIconCircle}>
            <View style={styles.innerGlow}>
              <Ionicons name="wallet" size={80} color="#00FF88" />
            </View>
          </View>
        </View>

        <Text style={styles.title}>
          {hasWallet ? '¡Bienvenido de Vuelta!' : 'Comenzar'}
        </Text>
        <Text style={styles.subtitle}>
          {hasWallet 
            ? 'Accede a tu billetera Solana no-custodial'
            : 'Crea o importa tu billetera Solana no-custodial'
          }
        </Text>

        <View style={styles.buttonContainer}>
          {hasWallet ? (
            <TouchableOpacity 
              style={styles.accessButton} 
              onPress={handleAccessWallet}
            >
              <LinearGradient
                colors={['#1E90FF', '#FF006E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Ionicons name="arrow-forward" size={24} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.primaryButtonText}>Acceder Billetera</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.primaryButton} 
                onPress={handleCreateWallet}
              >
                <LinearGradient
                  colors={['#1E90FF', '#FF006E']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  <Ionicons name="add-circle" size={24} color="#FFFFFF" style={styles.buttonIcon} />
                  <Text style={styles.primaryButtonText}>Nueva Billetera</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.secondaryButton} 
                onPress={handleImportWallet}
              >
                <LinearGradient
                  colors={['transparent', 'transparent']}
                  style={styles.secondaryGradient}
                >
                  <Ionicons name="download" size={24} color="#1E90FF" style={styles.buttonIcon} />
                  <Text style={styles.secondaryButtonText}>Importar Billetera</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Street-Style Features */}
        <View style={styles.features}>
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Ionicons name="shield-checkmark" size={28} color="#00FF88" />
            </View>
            <Text style={styles.featureText}>No-Custodial</Text>
            <Text style={styles.featureSubtext}>Tu Control</Text>
          </View>
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Ionicons name="flash" size={28} color="#1E90FF" />
            </View>
            <Text style={styles.featureText}>Rápido</Text>
            <Text style={styles.featureSubtext}>Transferencias</Text>
          </View>
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Ionicons name="gift" size={28} color="#FF006E" />
            </View>
            <Text style={styles.featureText}>Recompensas</Text>
            <Text style={styles.featureSubtext}>SLT Tokens</Text>
          </View>
        </View>
      </Animated.View>
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
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 4,
    textShadowColor: '#1E90FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  loadingSubtext: {
    fontSize: 18,
    color: '#AAAAAA',
    marginTop: 12,
    letterSpacing: 2,
  },
  gradientHeader: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 6,
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 16,
    color: '#AAAAAA',
    marginTop: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  badge: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#00FF88',
  },
  badgeText: {
    fontSize: 12,
    color: '#00FF88',
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    paddingTop: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  neonIconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#0C0C0C',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#00FF88',
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },
  innerGlow: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 50,
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 20,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  accessButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 20,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  secondaryButton: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#1E90FF',
    overflow: 'hidden',
  },
  secondaryGradient: {
    paddingVertical: 20,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#1E90FF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  buttonIcon: {
    marginRight: 12,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 60,
    paddingHorizontal: 10,
  },
  feature: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(30, 144, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(30, 144, 255, 0.3)',
  },
  featureText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  featureSubtext: {
    color: '#AAAAAA',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});