import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WalletService } from '../services/WalletService';
import { ApiService } from '../services/ApiService';

interface KYCStatus {
  status: string;
  created_at?: string;
  updated_at?: string;
  message?: string;
}

export default function KYCScreen() {
  const router = useRouter();
  const [walletData, setWalletData] = useState<any>(null);
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  
  const fadeAnim = new Animated.Value(0);
  const rocketAnim = new Animated.Value(0);
  const progressAnim = new Animated.Value(0);

  useEffect(() => {
    loadWalletAndKYCStatus();
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(rocketAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(rocketAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  };

  const loadWalletAndKYCStatus = async () => {
    try {
      const wallet = await WalletService.getStoredWalletData();
      if (!wallet) {
        router.replace('/');
        return;
      }
      
      setWalletData(wallet);
      
      // Check existing KYC status
      const status = await ApiService.getKYCStatus(wallet.publicKey);
      setKycStatus(status);
      
      // Animate progress based on status
      let progress = 0;
      if (status.status === 'under_review') progress = 0.5;
      else if (status.status === 'approved') progress = 1;
      
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 1000,
        useNativeDriver: false,
      }).start();
      
    } catch (error) {
      console.error('Error loading KYC status:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleStartKYC = async () => {
    if (!email.trim() || !fullName.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      const result = await ApiService.startKYC(walletData.publicKey, email, fullName);
      
      if (result.success) {
        Alert.alert(
          '🚀 ¡KYC Iniciado!',
          'Tu proceso de verificación ha comenzado. Te notificaremos cuando esté completo.',
          [{ text: 'OK', onPress: loadWalletAndKYCStatus }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar el proceso KYC');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return { name: 'time-outline', color: '#FF6B35' };
      case 'under_review':
        return { name: 'eye-outline', color: '#1E90FF' };
      case 'approved':
        return { name: 'checkmark-circle', color: '#00FF88' };
      default:
        return { name: 'help-circle-outline', color: '#AAAAAA' };
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Proceso iniciado, esperando revisión';
      case 'under_review':
        return 'Nuestro equipo está revisando tu información';
      case 'approved':
        return '¡Felicidades! Tu cuenta ha sido verificada';
      default:
        return 'Estado desconocido';
    }
  };

  const getStatusTitle = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Verificación Pendiente';
      case 'under_review':
        return 'En Revisión';
      case 'approved':
        return '¡Verificado! 🎉';
      default:
        return 'Sin Iniciar';
    }
  };

  if (checking) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LinearGradient
          colors={['#1E90FF', '#FF006E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientOverlay}
        >
          <Text style={styles.loadingText}>Verificando estado KYC...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0C0C0C" />
      
      {/* Gradient Header */}
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
            <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Verificación KYC</Text>
          
          <Animated.View style={{ opacity: rocketAnim }}>
            <Text style={styles.rocketEmoji}>🚀</Text>
          </Animated.View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Gamified Status Card */}
        <Animated.View style={[styles.statusSection, { opacity: fadeAnim }]}>
          {kycStatus && kycStatus.status !== 'not_started' ? (
            <LinearGradient
              colors={['rgba(30, 144, 255, 0.2)', 'rgba(255, 0, 110, 0.2)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statusGradient}
            >
              <View style={styles.statusContent}>
                <View style={styles.statusHeader}>
                  <View style={[styles.statusIcon, { backgroundColor: getStatusIcon(kycStatus.status).color + '20' }]}>
                    <Ionicons 
                      name={getStatusIcon(kycStatus.status).name as any} 
                      size={32} 
                      color={getStatusIcon(kycStatus.status).color} 
                    />
                  </View>
                  <View style={styles.statusInfo}>
                    <Text style={styles.statusTitle}>{getStatusTitle(kycStatus.status)}</Text>
                    <Text style={styles.statusMessage}>{getStatusMessage(kycStatus.status)}</Text>
                  </View>
                </View>
                
                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <Animated.View 
                      style={[
                        styles.progressFill,
                        {
                          width: progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%']
                          })
                        }
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {kycStatus.status === 'approved' ? '100%' : 
                     kycStatus.status === 'under_review' ? '75%' : 
                     kycStatus.status === 'pending' ? '25%' : '0%'} Completado
                  </Text>
                </View>
              </View>
            </LinearGradient>
          ) : (
            // Start KYC Form
            <Animated.View style={{ opacity: fadeAnim }}>
              <View style={styles.welcomeSection}>
                <LinearGradient
                  colors={['rgba(30, 144, 255, 0.1)', 'rgba(255, 0, 110, 0.1)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.welcomeGradient}
                >
                  <View style={styles.welcomeContent}>
                    <View style={styles.welcomeIcon}>
                      <Text style={styles.welcomeEmoji}>🔓</Text>
                    </View>
                    <Text style={styles.welcomeTitle}>¡Desbloquea tu Límite! 🚀</Text>
                    <Text style={styles.welcomeSubtitle}>
                      Verifica tu identidad para acceder a todas las funciones premium de SUÉLTALO
                    </Text>
                  </View>
                </LinearGradient>
              </View>

              {/* Benefits */}
              <View style={styles.benefitsSection}>
                <Text style={styles.benefitsTitle}>¿Qué obtienes al verificarte?</Text>
                <View style={styles.benefitsList}>
                  <View style={styles.benefitItem}>
                    <Ionicons name="flash" size={24} color="#00FF88" />
                    <Text style={styles.benefitText}>Límites de transacción más altos</Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Ionicons name="shield-checkmark" size={24} color="#1E90FF" />
                    <Text style={styles.benefitText}>Mayor seguridad para tu cuenta</Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Ionicons name="gift" size={24} color="#FF006E" />
                    <Text style={styles.benefitText}>Acceso a recompensas exclusivas</Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Ionicons name="star" size={24} color="#FFD700" />
                    <Text style={styles.benefitText}>Status VIP en la plataforma</Text>
                  </View>
                </View>
              </View>

              {/* Form */}
              <View style={styles.formSection}>
                <Text style={styles.formTitle}>Información Básica</Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Nombre Completo</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ingresa tu nombre completo..."
                    placeholderTextColor="#666666"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="tu@email.com"
                    placeholderTextColor="#666666"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity 
                  style={styles.submitButton} 
                  onPress={handleStartKYC}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={['#1E90FF', '#FF006E']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitGradient}
                  >
                    <Ionicons name="rocket" size={24} color="#FFFFFF" style={styles.submitIcon} />
                    <Text style={styles.submitText}>
                      {loading ? 'Procesando...' : 'Iniciar Verificación 🚀'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </Animated.View>

        {/* Street-Style Footer */}
        <Animated.View style={[styles.footerSection, { opacity: fadeAnim }]}>
          <Text style={styles.footerText}>
            🛡️ Tu información está protegida con encriptación de nivel bancario
          </Text>
          <Text style={styles.footerSubtext}>
            SUÉLTALO • Verificación segura • Proceso automatizado
          </Text>
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
  rocketEmoji: {
    fontSize: 28,
  },
  scrollContainer: {
    flex: 1,
  },
  statusSection: {
    margin: 20,
  },
  statusGradient: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(30, 144, 255, 0.3)',
  },
  statusContent: {
    gap: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  statusMessage: {
    fontSize: 14,
    color: '#AAAAAA',
    lineHeight: 20,
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#333333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00FF88',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#AAAAAA',
    textAlign: 'right',
  },
  welcomeSection: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  welcomeGradient: {
    padding: 32,
    alignItems: 'center',
  },
  welcomeContent: {
    alignItems: 'center',
  },
  welcomeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(30, 144, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeEmoji: {
    fontSize: 36,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 24,
  },
  benefitsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  benefitsList: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 144, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(30, 144, 255, 0.1)',
  },
  benefitText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 16,
    flex: 1,
    fontWeight: '500',
  },
  formSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(30, 144, 255, 0.3)',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 20,
  },
  submitGradient: {
    paddingVertical: 20,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitIcon: {
    marginRight: 12,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footerSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    letterSpacing: 1,
  },
});