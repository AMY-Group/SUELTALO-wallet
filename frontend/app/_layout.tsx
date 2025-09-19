import React from 'react';
import { SafeAreaView, StyleSheet, StatusBar, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { ErrorBoundary } from '../components/ErrorBoundary';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle="light-content" 
          backgroundColor="#0C0C0C" 
          translucent={Platform.OS === 'android'}
        />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0C0C0C' },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="dashboard" />
          <Stack.Screen name="send" />
          <Stack.Screen name="receive" />
          <Stack.Screen name="rewards" />
          <Stack.Screen name="kyc" />
          <Stack.Screen name="transactions" />
        </Stack>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0C0C',
  },
});