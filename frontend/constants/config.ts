import Constants from 'expo-constants';

// Centralized app configuration for environment-based values
// Priority: process.env (EAS/Expo build-time) -> app.json extra -> undefined (no hardcoded URLs)

const config = {
  backendUrl:
    (process.env.REACT_APP_BACKEND_URL as string | undefined) ||
    (process.env.EXPO_PUBLIC_BACKEND_URL as string | undefined) ||
    ((Constants.expoConfig?.extra as any)?.EXPO_PUBLIC_BACKEND_URL as string | undefined),

  solanaRpc:
    (process.env.REACT_APP_SOLANA_RPC as string | undefined) ||
    (process.env.EXPO_PUBLIC_SOLANA_RPC as string | undefined) ||
    ((Constants.expoConfig?.extra as any)?.EXPO_PUBLIC_SOLANA_RPC as string | undefined),

  sltMint:
    (process.env.EXPO_PUBLIC_SLT_MINT as string | undefined) ||
    ((Constants.expoConfig?.extra as any)?.EXPO_PUBLIC_SLT_MINT as string | undefined),

  usdcMint:
    (process.env.EXPO_PUBLIC_USDC_MINT as string | undefined) ||
    ((Constants.expoConfig?.extra as any)?.EXPO_PUBLIC_USDC_MINT as string | undefined),

  // External explorer base (optional). If not provided, feature should handle gracefully
  explorerBase:
    (process.env.EXPO_PUBLIC_EXPLORER_BASE as string | undefined) ||
    ((Constants.expoConfig?.extra as any)?.EXPO_PUBLIC_EXPLORER_BASE as string | undefined),
};

export default config;
