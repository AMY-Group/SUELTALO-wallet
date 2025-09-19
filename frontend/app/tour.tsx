import React, { useState } from 'react';
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

const tourSteps = [
  {
    title: "🔐 Tu llave, tu poder",
    subtitle: "Sin bancos. Sin permisos.",
    description: "Con SUÉLTALO, vos tenés el control total de tu plata. Nadie más puede tocar tus fondos porque vos tenés las llaves.",
    highlight: "Sin custodia",
    color: '#1E90FF'
  },
  {
    title: "⚡ Envíos al toque",
    subtitle: "Rápido como un rayo.",
    description: "Mandá USDC a cualquier parte del mundo en segundos. Sin esperas, sin papeles, sin drama.",
    highlight: "Global",
    color: '#FF006E'
  },
  {
    title: "🎁 Premios que suman",
    subtitle: "Ganás por cada movimiento.",
    description: "Cada vez que mandás plata, ganás tokens SLT. Mientras más usás SUÉLTALO, más premios acumulás.",
    highlight: "Rewards",
    color: '#00FF88'
  }
];

export default function TourScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // End of tour, navigate to onboarding
      router.push('/(onboarding)/create');
    }
  };

  const handleSkip = () => {
    router.push('/(onboarding)/create');
  };

  const currentTour = tourSteps[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0C0C0C" />
      
      {/* Skip Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>Saltar</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Icon/Visual */}
        <View style={[styles.iconContainer, { borderColor: currentTour.color }]}>
          <Text style={styles.iconText}>{currentTour.title.charAt(0)}</Text>
          <LinearGradient
            colors={[currentTour.color + '40', currentTour.color + '20']}
            style={styles.iconGradient}
          />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: currentTour.color }]}>
          {currentTour.title}
        </Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>{currentTour.subtitle}</Text>

        {/* Description */}
        <Text style={styles.description}>{currentTour.description}</Text>

        {/* Highlight */}
        <View style={[styles.highlightBox, { borderColor: currentTour.color }]}>
          <Text style={[styles.highlightText, { color: currentTour.color }]}>
            ✨ {currentTour.highlight}
          </Text>
        </View>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomSection}>
        {/* Dots Indicator */}
        <View style={styles.dotsContainer}>
          {tourSteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentStep && { ...styles.activeDot, backgroundColor: currentTour.color }
              ]}
            />
          ))}
        </View>

        {/* Next Button */}
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <LinearGradient
            colors={[currentTour.color, currentTour.color + 'CC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === tourSteps.length - 1 ? '¡Dale, empecemos!' : 'Siguiente'}
            </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  skipText: {
    color: '#AAAAAA',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
    overflow: 'hidden',
  },
  iconGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  iconText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    zIndex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  highlightBox: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  highlightText: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  bottomSection: {
    paddingHorizontal: 40,
    paddingBottom: 40,
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
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
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  nextButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});