import React, { useState, useEffect } from 'react';
import { Text, Platform } from 'react-native';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [hasWallet, setHasWallet] = useState(false);

  useEffect(() => {
    const checkWallet = async () => {
      try {
        // Check for wallet data using the same key as WalletService
        const walletData = await AsyncStorage.getItem('@wallet_data');
        
        console.log('Wallet check result:', walletData ? 'Found' : 'Not found');
        setHasWallet(!!walletData);
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