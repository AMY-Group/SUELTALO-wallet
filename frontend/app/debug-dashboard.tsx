import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function DebugDashboard() {
  console.info('DEBUG_DASHBOARD_RENDER_OK');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0C0C0C" />
      
      {/* Fixed Height Gradient Header */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#1E90FF', '#FF006E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientHeader}
        >
          <View style={styles.header}>
            <Text style={styles.appName}>SUÉLTALO</Text>
            <Text style={styles.tagline}>Debug Dashboard Test 🚀</Text>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.contentContainer}>
        {/* DEBUG BLOCK */}
        <View style={styles.debugBlock}>
          <Text style={styles.debugText}>SUÉLTALO • Dashboard activo</Text>
        </View>

        {/* DEBUG CARDS */}
        <View style={styles.debugCard}>
          <Text style={styles.debugCardLabel}>USDC</Text>
        </View>
        
        <View style={styles.debugCard}>
          <Text style={styles.debugCardLabel}>SLT</Text>
        </View>
        
        <View style={styles.debugCard}>
          <Text style={styles.debugCardLabel}>SOL</Text>
        </View>

        <Text style={styles.testText}>Si puedes ver este texto, el render está funcionando ✅</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0C0C',
  },
  headerContainer: {
    height: 140,
  },
  gradientHeader: {
    flex: 1,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 3,
  },
  tagline: {
    fontSize: 16,
    color: '#AAAAAA',
    marginTop: 8,
    letterSpacing: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  debugBlock: {
    height: 120,
    backgroundColor: '#111',
    borderColor: '#1E90FF',
    borderWidth: 2,
    borderRadius: 16,
    margin: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  debugText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },
  debugCard: {
    height: 90,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#1E90FF',
    backgroundColor: 'rgba(30, 144, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  debugCardLabel: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 2,
  },
  testText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
});