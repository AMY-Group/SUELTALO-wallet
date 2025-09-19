import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);
  const glowAnim = new Animated.Value(0);

  useEffect(() => {
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
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();

    // Auto-navigate after animation
    const timer = setTimeout(() => {
      router.replace('/(onboarding)/welcome');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0C0C0C" />
      
      <LinearGradient
        colors={['#0C0C0C', '#1a1a2e', '#16213e', '#0f0f23']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        {/* Logo/Brand Section */}
        <Animated.View style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}>
          {/* Animated Glow Effect */}
          <Animated.View style={[
            styles.glowRing,
            {
              opacity: glowAnim,
              transform: [{ scale: Animated.add(1, Animated.multiply(glowAnim, 0.3)) }]
            }
          ]} />
          
          {/* Main Logo */}
          <View style={styles.logoSymbol}>
            <Text style={styles.logoEmoji}>💎</Text>
          </View>
          
          {/* Brand Name */}
          <LinearGradient
            colors={['#1E90FF', '#FF006E', '#00FF88']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.brandGradient}
          >
            <Text style={styles.brandText}>SUÉLTALO</Text>
          </LinearGradient>
          
          {/* Tagline */}
          <Text style={styles.tagline}>Tu lana, tus reglas</Text>
        </Animated.View>

        {/* Loading Indicator */}
        <Animated.View style={[
          styles.loadingContainer,
          { opacity: fadeAnim }
        ]}>
          <View style={styles.loadingDots}>
            <Animated.View style={[
              styles.dot,
              {
                opacity: Animated.add(0.3, Animated.multiply(glowAnim, 0.7))
              }
            ]} />
            <Animated.View style={[
              styles.dot,
              {
                opacity: Animated.add(0.3, Animated.multiply(
                  Animated.add(glowAnim, -0.2), 0.7
                ))
              }
            ]} />
            <Animated.View style={[
              styles.dot,
              {
                opacity: Animated.add(0.3, Animated.multiply(
                  Animated.add(glowAnim, -0.4), 0.7
                ))
              }
            ]} />
          </View>
          <Text style={styles.loadingText}>Preparando tu wallet...</Text>
        </Animated.View>

        {/* Bottom Branding */}
        <View style={styles.bottomBranding}>
          <Text style={styles.poweredBy}>Powered by</Text>
          <Text style={styles.amyGroup}>AMYGROUP LLC</Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0C0C',
  },
  gradientBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  glowRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#00FF88',
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 30,
  },
  logoSymbol: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 20,
  },
  logoEmoji: {
    fontSize: 48,
    textAlign: 'center',
  },
  brandGradient: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 25,
    marginBottom: 16,
  },
  brandText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 4,
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 18,
    color: '#AAAAAA',
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    position: 'absolute',
    bottom: 150,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00FF88',
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  loadingText: {
    fontSize: 16,
    color: '#AAAAAA',
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomBranding: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  poweredBy: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  amyGroup: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 1,
  },
});