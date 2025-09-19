import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { WalletService } from '../../services/WalletService';

const { width, height } = Dimensions.get('window');

export default function OnboardingCTAScreen() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const generateWallet = async () => {
    try {
      setIsCreating(true);
      
      // Use WalletService to generate wallet
      const walletData = await WalletService.generateWallet();
      
      if (walletData) {
        console.log('Wallet created successfully');
        Alert.alert(
          '¡Wallet creada! 🎉',
          'Tu billetera fue creada exitosamente. ¡Ya podés empezar a usar SUÉLTALO!',
          [
            {
              text: '¡Dale!',
              onPress: () => router.replace('/(wallet)/home')
            }
          ]
        );
      } else {
        throw new Error('Failed to generate wallet');
      }
    } catch (error) {
      console.error('Error creating wallet:', error);
      Alert.alert(
        'Error',
        'No pudimos crear tu billetera. Intentá de nuevo.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateWallet = () => {
    generateWallet();
  };

  const handleImportWallet = () => {
    // Navigate to import wallet flow (to be implemented)
    Alert.alert(
      'Importar billetera',
      'Esta función estará disponible pronto. Por ahora, creá una nueva billetera.',
      [{ text: 'OK' }]
    );
  };

  const handleSkip = () => {
    // Direct redirect to wallet home without wallet (demo mode)
    Alert.alert(
      'Modo Demo',
      'Vas a entrar en modo demo sin billetera. Podés crear una después.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          onPress: () => router.replace('/(wallet)/home')
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0C0C0C" />
      
      {/* Neon Green Glow Background Effect */}
      <View style={styles.neonGlowBackground}>
        <View style={styles.glowCircle1} />
        <View style={styles.glowCircle2} />
        <View style={styles.glowCircle3} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Hero Icon */}
        <View style={styles.heroContainer}>
          <View style={styles.heroIconContainer}>
            <Text style={styles.heroIcon}>💎</Text>
            <View style={styles.heroGlow} />
          </View>
        </View>

        {/* Title with Neon Effect */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleMain}>Tu Wallet.</Text>
          <Text style={styles.titleMain}>Tus Reglas.</Text>
          <Text style={styles.titleAccent}>Sin Bancos.</Text>
          <Text style={styles.titleAccent}>Sin Drama.</Text>
        </View>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Dale, suéltalo de una vez. Tu plata, tu control, tu decisión.
        </Text>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          {/* Primary Button */}
          <TouchableOpacity 
            style={[styles.primaryButton, isCreating && styles.primaryButtonDisabled]} 
            onPress={handleCreateWallet}
            disabled={isCreating}
          >
            <LinearGradient
              colors={isCreating ? ['#666666', '#888888'] : ['#1E90FF', '#00BFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryButtonGradient}
            >
              <Text style={styles.primaryButtonText}>
                {isCreating ? 'Creando tu wallet... 💎' : 'Crear mi wallet 🚀'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Secondary Button */}
          <TouchableOpacity style={styles.secondaryButton} onPress={handleImportWallet}>
            <Text style={styles.secondaryButtonText}>Ya tengo una</Text>
          </TouchableOpacity>
        </View>

        {/* Features Highlight */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>🔒</Text>
            <Text style={styles.featureText}>100% sin custodia</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>⚡</Text>
            <Text style={styles.featureText}>Súper rápido</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>🌎</Text>
            <Text style={styles.featureText}>Global</Text>
          </View>
        </View>
      </View>

      {/* Bottom Skip Link */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>Sáltatelo por ahora</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0C0C',
  },
  neonGlowBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  glowCircle1: {
    position: 'absolute',
    top: 100,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 50,
    elevation: 30,
  },
  glowCircle2: {
    position: 'absolute',
    top: 300,
    right: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(0, 255, 136, 0.08)',
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 60,
    elevation: 25,
  },
  glowCircle3: {
    position: 'absolute',
    bottom: 150,
    left: width / 2 - 75,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(0, 255, 136, 0.12)',
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 20,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    zIndex: 10,
  },
  heroContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  heroIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIcon: {
    fontSize: 64,
    zIndex: 2,
  },
  heroGlow: {
    position: 'absolute',
    top: -15,
    left: -15,
    right: -15,
    bottom: -15,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 255, 136, 0.3)',
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 25,
    elevation: 25,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  titleMain: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 2,
    lineHeight: 38,
    textShadowColor: '#00FF88',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  titleAccent: {
    fontSize: 32,
    fontWeight: '900',
    color: '#00FF88',
    textAlign: 'center',
    letterSpacing: 2,
    lineHeight: 38,
    textShadowColor: '#00FF88',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  subtitle: {
    fontSize: 18,
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 26,
    paddingHorizontal: 20,
    fontWeight: '600',
  },
  buttonsContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 40,
  },
  primaryButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },
  primaryButtonDisabled: {
    shadowColor: '#666666',
    shadowOpacity: 0.4,
  },
  primaryButtonGradient: {
    paddingVertical: 20,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  secondaryButton: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#666666',
    paddingVertical: 20,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(102, 102, 102, 0.1)',
  },
  secondaryButtonText: {
    color: '#CCCCCC',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#00FF88',
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  bottomContainer: {
    paddingBottom: 40,
    alignItems: 'center',
    zIndex: 10,
  },
  skipText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});