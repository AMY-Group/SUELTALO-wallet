import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { WalletService } from '../services/WalletService';

const LOCK_TIMEOUT_MS = 120000; // 2 minutes

export function useAuthLock() {
  const [isLocked, setIsLocked] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const appState = useRef(AppState.currentState);
  const backgroundTimestamp = useRef<number>(0);

  // Check if device supports biometric/PIN authentication
  const checkBiometricSupport = async () => {
    if (Platform.OS === 'web') return false;
    
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  };

  // Authenticate user
  const authenticate = async (): Promise<boolean> => {
    try {
      setIsAuthenticating(true);
      
      const supported = await checkBiometricSupport();
      if (!supported) {
        // No biometric support, unlock by default for demo
        setIsLocked(false);
        await WalletService.setLocked(false);
        return true;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Desbloquear SUÉLTALO',
        fallbackLabel: 'Usar PIN',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsLocked(false);
        await WalletService.setLocked(false);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Lock the app
  const lock = async () => {
    setIsLocked(true);
    await WalletService.setLocked(true);
  };

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      // App going to background
      if (appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
        backgroundTimestamp.current = Date.now();
      }

      // App coming to foreground
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        const timeInBackground = Date.now() - backgroundTimestamp.current;
        
        // Lock if exceeded timeout
        if (timeInBackground > LOCK_TIMEOUT_MS) {
          await lock();
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Check lock state on mount
  useEffect(() => {
    const checkLockState = async () => {
      const locked = await WalletService.isLocked();
      setIsLocked(locked);
    };
    checkLockState();
  }, []);

  return {
    isLocked,
    isAuthenticating,
    authenticate,
    lock,
  };
}
