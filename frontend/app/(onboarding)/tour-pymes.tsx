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

const { width, height } = Dimensions.get('window');

export default function TourPyMesScreen() {
  const router = useRouter();

  const handleContinue = () => {
    // Navigate to next tour step (3/3)
    router.push('/(onboarding)/tour-freelancers');
  };

  const handleSkip = () => {
    router.push('/(onboarding)/final');
  };

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
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Saltar</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Big Emoji Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.iconEmoji}>🏪</Text>
          <View style={styles.iconGlow} />
        </View>

        {/* Title */}
        <Text style={styles.title}>
          Cobra en dólares digitales
        </Text>

        {/* Subtext */}
        <Text style={styles.subtext}>
          Vende y recibe pagos globales, sin drama
        </Text>

        {/* Feature Points */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>💳</Text>
            <Text style={styles.featureText}>Acepta pagos internacionales</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>📈</Text>
            <Text style={styles.featureText}>Expande tu negocio global</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>💰</Text>
            <Text style={styles.featureText}>Sin comisiones abusivas</Text>
          </View>
        </View>

        {/* Business Benefits */}
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>Perfect para tu PyME:</Text>
          <View style={styles.benefitsList}>
            <Text style={styles.benefitItem}>✅ E-commerce internacional</Text>
            <Text style={styles.benefitItem}>✅ Servicios digitales</Text>
            <Text style={styles.benefitItem}>✅ Consultoría remota</Text>
          </View>
        </View>
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Navigation Dots Indicator (Step 2/3) */}
        <View style={styles.dotsContainer}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
        </View>
        <Text style={styles.stepText}>2/3</Text>

        {/* Continue Button */}
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <LinearGradient
            colors={['#1E90FF', '#FF006E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Continuar</Text>
          </LinearGradient>
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
  gradientHeader: {
    height: 120,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  iconEmoji: {
    fontSize: 80,
    textAlign: 'center',
    zIndex: 2,
  },
  iconGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 60,
    backgroundColor: 'rgba(30, 144, 255, 0.2)',
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.5,
    lineHeight: 34,
  },
  subtext: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  featuresContainer: {
    gap: 16,
    width: '100%',
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 144, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(30, 144, 255, 0.3)',
  },
  featureEmoji: {
    fontSize: 20,
    marginRight: 16,
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  benefitsContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 0, 110, 0.1)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 0, 110, 0.3)',
  },
  benefitsTitle: {
    fontSize: 18,
    color: '#FF006E',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomSection: {
    paddingHorizontal: 40,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF006E',
    shadowColor: '#FF006E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  stepText: {
    fontSize: 14,
    color: '#AAAAAA',
    fontWeight: '600',
    marginTop: -12,
  },
  continueButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
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
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});