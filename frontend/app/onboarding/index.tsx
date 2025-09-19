import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function OnboardingIndex() {
  const router = useRouter();

  const handleCreateWallet = () => {
    router.push('/onboarding/create');
  };

  const handleImportWallet = () => {
    router.push('/onboarding/import');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0C0C0C" />
      
      <LinearGradient
        colors={['#1E90FF', '#FF006E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <View style={styles.header}>
          <Text style={styles.appName}>SUÉLTALO</Text>
          <Text style={styles.tagline}>Empecemos 🚀</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.title}>¿Qué quieres hacer?</Text>
        
        <TouchableOpacity style={styles.primaryButton} onPress={handleCreateWallet}>
          <LinearGradient
            colors={['#1E90FF', '#FF006E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonIcon}>➕</Text>
            <Text style={styles.primaryButtonText}>Crear mi billetera</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleImportWallet}>
          <Text style={styles.secondaryButtonIcon}>📱</Text>
          <Text style={styles.secondaryButtonText}>Ya tengo una</Text>
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
    height: 140,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 3,
  },
  tagline: {
    fontSize: 16,
    color: '#AAAAAA',
    marginTop: 8,
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
  },
  primaryButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
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
    letterSpacing: 0.5,
  },
  secondaryButton: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#1E90FF',
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
    letterSpacing: 0.5,
  },
  buttonIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  secondaryButtonIcon: {
    fontSize: 18,
    marginRight: 12,
  },
});