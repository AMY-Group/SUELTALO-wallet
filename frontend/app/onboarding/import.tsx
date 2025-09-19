import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { WalletService } from '../../services/WalletService';

export default function ImportWalletScreen() {
  const router = useRouter();
  const [seedPhrase, setSeedPhrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [walletData, setWalletData] = useState<any>(null);

  const validateAndImportWallet = async () => {
    if (!seedPhrase.trim()) {
      Alert.alert('¡Órale!', 'Ponle tus palabras secretas primero');
      return;
    }

    const words = seedPhrase.trim().split(/\s+/);
    if (words.length < 12 || words.length > 24) {
      Alert.alert('¡Revisa tus palabras!', 'Deben ser entre 12 y 24 palabras');
      return;
    }

    setLoading(true);
    try {
      const wallet = await WalletService.restoreWalletFromMnemonic(seedPhrase.trim());
      setWalletData(wallet);
      setStep(2);
    } catch (error) {
      Alert.alert('¡Esas palabras no están bien!', 'Revísalas otra vez o pregúntale a quien te las dio');
      console.error('Wallet import error:', error);
    } finally {
      setLoading(false);
    }
  };

  const finishImport = () => {
    Alert.alert(
      '¡Órale! Tu billetera ya está aquí 🎉',
      'Todas tus cosas están como las dejaste. ¡Ya puedes usar tu lana!',
      [
        {
          text: 'Ver mi billetera',
          onPress: () => router.replace('/dashboard'),
        },
      ]
    );
  };

  const renderStep1 = () => (
    <KeyboardAvoidingView 
      style={styles.stepContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="download-outline" size={60} color="#1E90FF" />
      </View>
      
      <Text style={styles.title}>¡Trae tu billetera de vuelta!</Text>
      <Text style={styles.subtitle}>
        Pon tus 12 o 24 palabras secretas para recuperar tu lana. Asegúrate de estar en un lugar seguro.
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Tus palabras secretas</Text>
        <LinearGradient
          colors={seedPhrase ? ['rgba(30, 144, 255, 0.2)', 'rgba(255, 0, 110, 0.2)'] : ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.inputGradient}
        >
          <TextInput
            style={styles.seedInput}
            placeholder="Escribe tus palabras aquí, separadas por espacios..."
            placeholderTextColor="#666666"
            value={seedPhrase}
            onChangeText={setSeedPhrase}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={false}
          />
        </LinearGradient>
        <Text style={styles.wordCount}>
          {seedPhrase.trim().split(/\s+/).filter(word => word.length > 0).length} palabras
        </Text>
      </View>

      <View style={styles.warningBox}>
        <Ionicons name="shield-checkmark" size={20} color="#00FF88" />
        <Text style={styles.warningText}>
          Tus palabras se quedan en tu teléfono nada más. No las mandamos a ningún lado.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, (!seedPhrase.trim() || loading) && styles.disabledButton]}
        onPress={validateAndImportWallet}
        disabled={!seedPhrase.trim() || loading}
      >
        <LinearGradient
          colors={(!seedPhrase.trim() || loading) ? ['#333333', '#444444'] : ['#1E90FF', '#00BFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>¡Traer mi billetera!</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="checkmark-circle" size={60} color="#00FF88" />
      </View>

      <Text style={styles.title}>¡Órale! Tu billetera ya está aquí 🎉</Text>
      <Text style={styles.subtitle}>
        Todo salió perfecto. Tu billetera ya está lista y puedes ver tu lana y todos tus movimientos.
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
        onPress={finishImport}
      >
        <LinearGradient
          colors={['#00FF88', '#4CAF50']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>¡Ver mi lana!</Text>
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
          
          <Text style={styles.headerTitle}>Traer Billetera</Text>
          
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>{step}/2</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
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
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 30,
  },
  inputLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  inputGradient: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(30, 144, 255, 0.3)',
  },
  seedInput: {
    padding: 20,
    color: '#FFFFFF',
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    lineHeight: 24,
  },
  wordCount: {
    color: '#AAAAAA',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'right',
    fontWeight: '600',
  },
  warningBox: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderWidth: 1,
    borderColor: '#00FF88',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  warningText: {
    color: '#00FF88',
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
  disabledButton: {
    opacity: 0.5,
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