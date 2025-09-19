import React, { useState, useEffect } from 'react';
import { Text } from 'react-native';
import { Redirect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [hasWallet, setHasWallet] = useState(false);

  useEffect(() => {
    const checkWallet = async () => {
      const secret = await SecureStore.getItemAsync("secret");
      setHasWallet(!!secret);
      setLoading(false);
    };
    checkWallet();
  }, []);

  if (loading) return <Text style={{color:"white"}}>Cargando...</Text>;

  return hasWallet ? (
    <Redirect href="/(wallet)/home" />
  ) : (
    <Redirect href="/(onboarding)/splash" />
  );
}