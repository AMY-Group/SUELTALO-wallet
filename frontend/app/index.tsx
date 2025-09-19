import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasWallet, setHasWallet] = useState(false);

  useEffect(() => {
    checkWalletExists();
  }, []);

  const checkWalletExists = async () => {
    try {
      const secret = await SecureStore.getItemAsync('secret');
      console.log('Checking wallet existence:', secret ? 'Found' : 'Not found');
      
      // TEMPORARY: Force wallet existence for testing
      setHasWallet(true);
      
      // Normal logic (commented out for testing):
      // setHasWallet(!!secret);
    } catch (error) {
      console.error('Error checking wallet:', error);
      setHasWallet(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#1E90FF', '#FF006E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientOverlay}
        >
          <Text style={styles.loadingText}>SUÉLTALO</Text>
          <Text style={styles.loadingSubtext}>Cargando... 💰</Text>
        </LinearGradient>
      </View>
    );
  }

  // Redirect based on wallet existence
  if (hasWallet) {
    console.log('Wallet found, redirecting to /(wallet)/home');
    return <Redirect href="/(wallet)/home" />;
  } else {
    console.log('No wallet found, redirecting to /(onboarding)/create');
    return <Redirect href="/(onboarding)/create" />;
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0C0C0C',
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 4,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 18,
    color: '#AAAAAA',
    marginTop: 12,
    letterSpacing: 1,
    textAlign: 'center',
  },
});