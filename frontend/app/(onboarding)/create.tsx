import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { WalletService } from '../../services/WalletService';

export default function CreateWalletScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [walletData, setWalletData] = useState<any>(null);
  const [seedPhraseRevealed, setSeedPhraseRevealed] = useState(false);
  const [seedPhraseConfirmed, setSeedPhraseConfirmed] = useState(false);

  const createWallet = async () => {
    setLoading(true);
    try {
      const newWallet = await WalletService.generateNewWallet();
      setWalletData(newWallet);
      setStep(2);
    } catch (error) {
      Alert.alert('¡Órale!', 'No pudimos crear tu billetera, inténtalo otra vez');
      console.error('Wallet creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedPhraseReveal = () => {
    setSeedPhraseRevealed(true);
  };

  const confirmSeedPhrase = () => {
    setSeedPhraseConfirmed(true);
    setStep(3);
  };

  const finishSetup = () => {
    Alert.alert(
      '¡Órale! Tu billetera ya está lista 🎉',
      'Ya puedes mandar y recibir lana sin broncas. ¡Dale que empecemos!',
      [
        {
          text: 'Ver mi billetera',
          onPress: () => router.replace('/dashboard'),
        },
      ]
    );
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="add-circle-outline" size={60} color="#00FF88" />
      </View>
      
      <Text style={styles.title}>¡Dale, vamos a crear tu billetera!</Text>
      <Text style={styles.subtitle}>
        Te vamos a dar 12 palabras súper importantes. Son como la llave de tu casa digital - cuídalas y no se las muestres a nadie.
      </Text>

      <View style={styles.warningBox}>
        <Ionicons name="warning" size={20} color="#FF6B35" />
        <Text style={styles.warningText}>
          SUÉLTALO no guarda tus palabras. Si las pierdes, perdemos tu lana para siempre. ¡En serio!
        </Text>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={createWallet}
        disabled={loading}
      >
        <LinearGradient
          colors={['#00FF88', '#4CAF50']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>¡Crear mis palabras secretas!</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="eye" size={60} color="#1E90FF" />
      </View>

      <Text style={styles.title}>Tus 12 palabras mágicas</Text>
      <Text style={styles.subtitle}>
        Anótalas en un papel y guárdalas súper bien. Son lo único que necesitas para recuperar tu lana si algo pasa.
      </Text>

      {!seedPhraseRevealed ? (
        <View style={styles.hiddenSeedContainer}>
          <Ionicons name="eye-off" size={40} color="#666" />
          <Text style={styles.hiddenSeedText}>
            Toca para ver tus palabras secretas
          </Text>
          <Text style={styles.hiddenSeedSubtext}>
            Asegúrate de estar en un lugar privado
          </Text>
          <TouchableOpacity
            style={styles.revealButton}
            onPress={handleSeedPhraseReveal}
          >
            <LinearGradient
              colors={['#1E90FF', '#00BFFF']}
              style={styles.revealGradient}
            >
              <Text style={styles.revealButtonText}>Ver mis palabras</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.seedPhraseContainer}>
          <LinearGradient
            colors={['rgba(30, 144, 255, 0.1)', 'rgba(255, 0, 110, 0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.seedGradient}
          >
            <View style={styles.seedGrid}>
              {walletData?.mnemonic.split(' ').map((word: string, index: number) => (
                <View key={index} style={styles.seedWord}>
                  <Text style={styles.seedWordNumber}>{index + 1}</Text>
                  <Text style={styles.seedWordText}>{word}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </View>
      )}

      {seedPhraseRevealed && (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={confirmSeedPhrase}
        >
          <LinearGradient
            colors={['#00FF88', '#4CAF50']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>¡Ya las anoté!</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="checkmark-circle" size={60} color="#00FF88" />
      </View>

      <Text style={styles.title}>¡Órale! Tu billetera ya está lista 🎉</Text>
      <Text style={styles.subtitle}>
        Ya puedes mandar feria a tu familia, cobrar en dólares digitales y ganar premios SLT. ¡Todo sin broncas!
      </Text>

      <View style={styles.walletInfo}>
        <LinearGradient
          colors={['rgba(0, 255, 136, 0.1)', 'rgba(30, 144, 255, 0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.walletGradient}
        >
          <Text style={styles.walletLabel}>Tu dirección de billetera:</Text>
          <Text style={styles.walletAddress}>{walletData?.publicKey}</Text>
        </LinearGradient>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={finishSetup}
      >
        <LinearGradient
          colors={['#1E90FF', '#FF006E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>¡Dale, vamos a empezar!</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

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
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Crear Billetera</Text>
          
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>{step}/3</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0C0C',
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
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  stepIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stepText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContainer: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  warningBox: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderWidth: 1,
    borderColor: '#FF6B35',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  warningText: {
    color: '#FF6B35',
    fontSize: 14,
    flex: 1,
    marginLeft: 12,
    lineHeight: 20,
    fontWeight: '600',
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
  },
  buttonGradient: {
    paddingVertical: 20,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  hiddenSeedContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(30, 144, 255, 0.3)',
    width: '100%',
  },
  hiddenSeedText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  hiddenSeedSubtext: {
    color: '#AAAAAA',
    fontSize: 14,
    marginBottom: 30,
    textAlign: 'center',
  },
  revealButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  revealGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  revealButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  seedPhraseContainer: {
    width: '100%',
    marginBottom: 40,
    borderRadius: 16,
    overflow: 'hidden',
  },
  seedGradient: {
    padding: 24,
  },
  seedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  seedWord: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: '30%',
  },
  seedWordNumber: {
    color: '#1E90FF',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 8,
    minWidth: 20,
  },
  seedWordText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  walletInfo: {
    width: '100%',
    marginBottom: 40,
    borderRadius: 16,
    overflow: 'hidden',
  },
  walletGradient: {
    padding: 24,
  },
  walletLabel: {
    color: '#AAAAAA',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  walletAddress: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
});