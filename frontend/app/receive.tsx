import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Share,
  Alert,
  StatusBar,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { WalletService } from '../services/WalletService';

export default function ReceiveScreen() {
  const router = useRouter();
  const [walletData, setWalletData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);
  const glowAnim = new Animated.Value(0);

  useEffect(() => {
    loadWalletData();
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  };

  const loadWalletData = async () => {
    try {
      const wallet = await WalletService.getStoredWalletData();
      if (!wallet) {
        router.replace('/');
        return;
      }
      
      setWalletData(wallet);
    } catch (error) {
      console.error('Error loading wallet data:', error);
      Alert.alert('¡Órale!', 'No pudimos cargar tu billetera, inténtalo otra vez');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAddress = async () => {
    try {
      // For React Native, we'd normally use Clipboard, but this is a web fallback
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(walletData.publicKey);
      }
      
      // Success animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      Alert.alert('¡Listo! 📋', 'Tu dirección ya está copiada, péganla donde la necesites');
    } catch (error) {
      console.error('Error copying address:', error);
      Alert.alert('¡No se pudo!', 'Algo falló, inténtalo otra vez');
    }
  };

  const handleShareAddress = async () => {
    try {
      await Share.share({
        message: `¡Órale! Aquí está mi dirección de SUÉLTALO para que me mandes lana:\n\n${walletData.publicKey}\n\n¡Mándamela al toque! 🚀💰`,
        title: 'Mi dirección SUÉLTALO',
      });
    } catch (error) {
      console.error('Error sharing address:', error);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LinearGradient
          colors={['#1E90FF', '#00FF88']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientOverlay}
        >
          <Text style={styles.loadingText}>Preparando tu código QR... 📱</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0C0C0C" />
      
      {/* Gradient Header */}
      <LinearGradient
        colors={['#00FF88', '#1E90FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Cobrar Lana 💰</Text>
          
          <TouchableOpacity style={styles.shareButton} onPress={handleShareAddress}>
            <Ionicons name="share-outline" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Street-Style Instructions */}
        <Animated.View style={[styles.instructionsSection, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={['rgba(0, 255, 136, 0.1)', 'rgba(30, 144, 255, 0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.instructionsGradient}
          >
            <View style={styles.instructionsContent}>
              <View style={styles.instructionsIcon}>
                <Text style={styles.instructionsEmoji}>💸</Text>
              </View>
              <Text style={styles.instructionsTitle}>¡Es súper fácil cobrar!</Text>
              <Text style={styles.instructionsText}>
                Comparte tu código QR o dirección para que te manden USDC, SOL o cualquier token sin broncas
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Neon QR Code */}
        <Animated.View 
          style={[
            styles.qrSection, 
            { 
              opacity: fadeAnim, 
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <View style={styles.qrContainer}>
            <Animated.View 
              style={[
                styles.qrGlow,
                {
                  opacity: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 0.8]
                  })
                }
              ]}
            />
            <LinearGradient
              colors={['rgba(0, 255, 136, 0.2)', 'rgba(30, 144, 255, 0.2)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.qrGradient}
            >
              <View style={styles.qrCodeWrapper}>
                <QRCode
                  value={walletData?.publicKey || ''}
                  size={200}
                  backgroundColor="transparent"
                  color="#FFFFFF"
                  logoSize={0}
                  quietZone={10}
                />
                
                {/* Digital Graffiti Overlay */}
                <View style={styles.qrOverlay}>
                  <Text style={styles.qrOverlayText}>SUÉLTALO</Text>
                  <Text style={styles.qrOverlaySubtext}>¡ESCANÉAME! 🚀</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Address Info */}
        <Animated.View style={[styles.addressSection, { opacity: fadeAnim }]}>
          <Text style={styles.addressTitle}>📱 Tu dirección de billetera</Text>
          
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addressGradient}
          >
            <View style={styles.addressContainer}>
              <View style={styles.addressContent}>
                <Text style={styles.addressLabel}>Dirección completa:</Text>
                <Text style={styles.fullAddress}>{walletData?.publicKey}</Text>
                <Text style={styles.shortAddress}>{formatAddress(walletData?.publicKey)}</Text>
              </View>
              
              <TouchableOpacity style={styles.copyButton} onPress={handleCopyAddress}>
                <LinearGradient
                  colors={['#1E90FF', '#00BFFF']}
                  style={styles.copyGradient}
                >
                  <Ionicons name="copy" size={24} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Supported Tokens */}
        <Animated.View style={[styles.tokensSection, { opacity: fadeAnim }]}>
          <Text style={styles.tokensTitle}>💰 Lana que puedes recibir</Text>
          
          <View style={styles.tokensList}>
            <View style={styles.tokenItem}>
              <LinearGradient
                colors={['rgba(30, 144, 255, 0.2)', 'rgba(30, 144, 255, 0.1)']}
                style={styles.tokenGradient}
              >
                <View style={styles.tokenIcon}>
                  <Ionicons name="card" size={24} color="#1E90FF" />
                </View>
                <View style={styles.tokenInfo}>
                  <Text style={styles.tokenSymbol}>USDC</Text>
                  <Text style={styles.tokenName}>Dólares digitales</Text>
                </View>
                <Text style={styles.tokenBadge}>LO MÁS USADO</Text>
              </LinearGradient>
            </View>

            <View style={styles.tokenItem}>
              <LinearGradient
                colors={['rgba(153, 69, 255, 0.2)', 'rgba(153, 69, 255, 0.1)']}
                style={styles.tokenGradient}
              >
                <View style={styles.tokenIcon}>
                  <Ionicons name="flash" size={24} color="#9945FF" />
                </View>
                <View style={styles.tokenInfo}>
                  <Text style={styles.tokenSymbol}>SOL</Text>
                  <Text style={styles.tokenName}>Para fees</Text>
                </View>
                <Text style={styles.tokenBadge}>SOLANA</Text>
              </LinearGradient>
            </View>

            <View style={styles.tokenItem}>
              <LinearGradient
                colors={['rgba(0, 255, 136, 0.2)', 'rgba(0, 255, 136, 0.1)']}
                style={styles.tokenGradient}
              >
                <View style={styles.tokenIcon}>
                  <Ionicons name="gift" size={24} color="#00FF88" />
                </View>
                <View style={styles.tokenInfo}>
                  <Text style={styles.tokenSymbol}>SLT</Text>
                  <Text style={styles.tokenName}>Tokens de premio</Text>
                </View>
                <Text style={styles.tokenBadge}>PREMIOS</Text>
              </LinearGradient>
            </View>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View style={[styles.actionsSection, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCopyAddress}>
            <LinearGradient
              colors={['#1E90FF', '#00BFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionGradient}
            >
              <Ionicons name="copy" size={24} color="#FFFFFF" style={styles.actionIcon} />
              <Text style={styles.actionText}>Copiar dirección</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleShareAddress}>
            <LinearGradient
              colors={['#00FF88', '#4CAF50']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionGradient}
            >
              <Ionicons name="share" size={24} color="#FFFFFF" style={styles.actionIcon} />
              <Text style={styles.actionText}>Compartir QR</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Safety Notice */}
        <Animated.View style={[styles.safetySection, { opacity: fadeAnim }]}>
          <View style={styles.safetyNotice}>
            <Ionicons name="shield-checkmark" size={20} color="#00FF88" />
            <Text style={styles.safetyText}>
              🛡️ Solo comparte tu dirección pública. Nunca compartas tu frase semilla con nadie, ¡es tuya nada más!
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0C0C',
  },
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
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  gradientHeader: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  shareButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  instructionsSection: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  instructionsGradient: {
    padding: 24,
    alignItems: 'center',
  },
  instructionsContent: {
    alignItems: 'center',
  },
  instructionsIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(30, 144, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  instructionsEmoji: {
    fontSize: 28,
  },
  instructionsTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: 1,
  },
  instructionsText: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 24,
  },
  qrSection: {
    alignItems: 'center',
    marginVertical: 30,
  },
  qrContainer: {
    position: 'relative',
  },
  qrGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    backgroundColor: '#00FF88',
    borderRadius: 30,
    zIndex: -1,
  },
  qrGradient: {
    padding: 30,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: 'rgba(0, 255, 136, 0.5)',
  },
  qrCodeWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  qrOverlay: {
    position: 'absolute',
    bottom: -10,
    alignItems: 'center',
  },
  qrOverlayText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#00FF88',
    letterSpacing: 2,
  },
  qrOverlaySubtext: {
    fontSize: 10,
    color: '#AAAAAA',
    marginTop: 2,
  },
  addressSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  addressTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  addressGradient: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(30, 144, 255, 0.3)',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressContent: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 8,
    fontWeight: '600',
  },
  fullAddress: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'monospace',
    lineHeight: 18,
    marginBottom: 8,
  },
  shortAddress: {
    fontSize: 16,
    color: '#00FF88',
    fontWeight: '700',
    letterSpacing: 1,
  },
  copyButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginLeft: 16,
  },
  copyGradient: {
    padding: 12,
  },
  tokensSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  tokensTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  tokensList: {
    gap: 12,
  },
  tokenItem: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  tokenGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  tokenName: {
    fontSize: 12,
    color: '#AAAAAA',
  },
  tokenBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 1,
  },
  actionsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 30,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    marginRight: 8,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  safetySection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  safetyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
  },
  safetyText: {
    color: '#AAAAAA',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});