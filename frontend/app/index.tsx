import React, { useState, useEffect } from 'react';
import { Text, Platform } from 'react-native';
import { Redirect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [hasWallet, setHasWallet] = useState(false);

  useEffect(() => {
    const checkWallet = async () => {
      try {
        let secret;
        if (Platform.OS === 'web') {
          // Use AsyncStorage for web
          secret = await AsyncStorage.getItem("secret");
        } else {
          // Use SecureStore for native
          secret = await SecureStore.getItemAsync("secret");
        }
        
        console.log('Wallet check result:', secret ? 'Found' : 'Not found');
        setHasWallet(!!secret);
      } catch (error) {
        console.error('Error checking wallet:', error);
        setHasWallet(false);
      } finally {
        setLoading(false);
      }
    };
    checkWallet();
  }, []);

  if (loading) return <Text style={{color:"white"}}>Cargando...</Text>;

  console.log('Redirecting to:', hasWallet ? '/(wallet)/home' : '/(onboarding)/splash');
  
  return hasWallet ? (
    <Redirect href="/(wallet)/home" />
  ) : (
    <Redirect href="/(onboarding)/splash" />
  );
}