import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  StatusBar,
  Dimensions,
  ImageBackground
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const [hasWallet, setHasWallet] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkExistingWallet();
  }, []);

  const checkExistingWallet = async () => {
    try {
      const walletData = await AsyncStorage.getItem('@wallet_data');
      if (walletData) {
        setHasWallet(true);
        // Auto-navigate to dashboard if wallet exists
        setTimeout(() => {
          router.replace('/dashboard');
        }, 2000);
      } else {
        setHasWallet(false);
      }
    } catch (error) {
      console.error('Error checking wallet:', error);
      setHasWallet(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWallet = () => {
    router.push('/onboarding/create');
  };

  const handleImportWallet = () => {
    router.push('/onboarding/import');
  };

  const handleAccessWallet = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Text style={styles.loadingText}>SUÉLTALO</Text>
          <Text style={styles.loadingSubtext}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      
      <View style={styles.header}>
        <Text style={styles.appName}>SUÉLTALO</Text>
        <Text style={styles.tagline}>Non-Custodial Crypto Wallet</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>SOLANA DEVNET</Text>
        </View>
      </View>

      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="wallet" size={60} color="#00D4FF" />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          {hasWallet ? 'Welcome Back!' : 'Get Started'}
        </Text>
        <Text style={styles.subtitle}>
          {hasWallet 
            ? 'Access your non-custodial Solana wallet'
            : 'Create or import your non-custodial Solana wallet'
          }
        </Text>

        <View style={styles.buttonContainer}>
          {hasWallet ? (
            <TouchableOpacity 
              style={[styles.primaryButton, styles.accessButton]} 
              onPress={handleAccessWallet}
            >
              <Ionicons name="arrow-forward" size={20} color="#0a0a0a" style={styles.buttonIcon} />
              <Text style={styles.primaryButtonText}>Access Wallet</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.primaryButton} 
                onPress={handleCreateWallet}
              >
                <Ionicons name="add-circle" size={20} color="#0a0a0a" style={styles.buttonIcon} />
                <Text style={styles.primaryButtonText}>Create New Wallet</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.secondaryButton} 
                onPress={handleImportWallet}
              >
                <Ionicons name="download" size={20} color="#00D4FF" style={styles.buttonIcon} />
                <Text style={styles.secondaryButtonText}>Import Existing Wallet</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Ionicons name="shield-checkmark" size={24} color="#00D4FF" />
            <Text style={styles.featureText}>Non-Custodial</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="flash" size={24} color="#00D4FF" />
            <Text style={styles.featureText}>Fast Transfers</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="gift" size={24} color="#00D4FF" />
            <Text style={styles.featureText}>SLT Rewards</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#00D4FF',
    letterSpacing: 2,
  },
  loadingSubtext: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#00D4FF',
    letterSpacing: 3,
  },
  tagline: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
    letterSpacing: 1,
  },
  badge: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  badgeText: {
    fontSize: 10,
    color: '#00D4FF',
    fontWeight: '600',
    letterSpacing: 1,
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00D4FF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#00D4FF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessButton: {
    backgroundColor: '#00D4FF',
  },
  primaryButtonText: {
    color: '#0a0a0a',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#00D4FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#00D4FF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  feature: {
    alignItems: 'center',
  },
  featureText: {
    color: '#888',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
});