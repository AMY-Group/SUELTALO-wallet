import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  const handleAccept = async () => {
    try {
      // Mark welcome as seen
      await SecureStore.setItemAsync('welcomeSeen', 'true');
      console.log('Welcome screen accepted, proceeding to onboarding');
      
      // Redirect to onboarding
      router.push('/(onboarding)/create');
    } catch (error) {
      console.error('Error saving welcome state:', error);
      router.push('/(onboarding)/create');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0C0C0C" />
      
      {/* Header with AMYGROUP LLC Logo */}
      <View style={styles.header}>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>AMYGROUP LLC</Text>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* SUÉLTALO Title with Gradient */}
        <LinearGradient
          colors={['#1E90FF', '#FF006E', '#8B5CF6']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.titleGradient}
        >
          <Text style={styles.title}>SUÉLTALO</Text>
        </LinearGradient>

        {/* Tagline */}
        <Text style={styles.tagline}>
          Tu wallet. Tus reglas. Sin bancos. Sin drama.
        </Text>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>¿Aún no soltaste?</Text>
          
          <View style={styles.infoContent}>
            <View style={styles.infoItem}>
              <Text style={styles.infoEmoji}>🔒</Text>
              <Text style={styles.infoText}>
                Con SUÉLTALO, creás tu wallet sin bancos, sin permiso, sin custodia.
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoEmoji}>👉</Text>
              <Text style={styles.infoText}>
                Dale vida a tu cripto. Tu llave, tu plata, tu decisión.
              </Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity style={styles.actionButton} onPress={handleAccept}>
          <View style={styles.neonGlow}>
            <LinearGradient
              colors={['#FF006E', '#FF4081']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Aceptar</Text>
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </View>

      {/* Bottom Decoration */}
      <View style={styles.bottomDecoration}>
        <Text style={styles.decorationText}>🚀 ¡Dale que arrancamos! 🚀</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0C0C',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 40,
  },
  logoPlaceholder: {
    width: 120,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#FF006E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 4,
    textShadowColor: '#FF006E',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    letterSpacing: 0.5,
  },
  infoBox: {
    backgroundColor: '#F2F2F2',
    borderRadius: 20,
    padding: 24,
    marginBottom: 40,
    width: '100%',
    maxWidth: 320,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0C0C0C',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  infoContent: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoEmoji: {
    fontSize: 20,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    lineHeight: 22,
    fontWeight: '600',
  },
  actionButton: {
    width: '100%',
    maxWidth: 280,
    borderRadius: 20,
    overflow: 'hidden',
  },
  neonGlow: {
    shadowColor: '#FF006E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },
  buttonGradient: {
    paddingVertical: 20,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  bottomDecoration: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  decorationText: {
    fontSize: 16,
    color: '#AAAAAA',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});