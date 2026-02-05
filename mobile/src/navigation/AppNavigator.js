import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState('Login');

  if (loading === true) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4002A" />
      </View>
    );
  }

  if (isAuthenticated === true) {
    return <HomeScreen />;
  }

  if (currentScreen === 'Register') {
    return <RegisterScreen navigation={{ navigate: (screen) => setCurrentScreen(screen) }} />;
  }

  return <LoginScreen navigation={{ navigate: (screen) => setCurrentScreen(screen) }} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F9',
  },
});
