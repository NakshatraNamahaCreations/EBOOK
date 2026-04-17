import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { authService } from '../src/services/auth.service';
import { useAppDispatch } from '../src/hooks/useAppDispatch';
import { setUser } from '../src/store/slices/authSlice';
import { resetStore } from '../src/store/store';

export default function SplashScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const valid = await authService.isSessionValid();
      if (!valid) {
        await authService.logout();
        dispatch(resetStore());
        setTimeout(() => router.replace('/onboarding'), 2000);
        return;
      }

      // Token exists — rehydrate Redux user from backend
      try {
        const user = await authService.fetchCurrentUser();
        dispatch(setUser(user));
        setTimeout(() => router.replace('/(tabs)/home'), 2000);
      } catch {
        // Token rejected by server — clear session
        await authService.logout();
        dispatch(resetStore());
        setTimeout(() => router.replace('/login'), 2000);
      }
    } catch {
      setTimeout(() => router.replace('/onboarding'), 2000);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/sj-logo.jpeg')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Salil Javeri</Text>
      <Text style={styles.subtitle}>Books, Audiobooks & Podcasts</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FF6B6B',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#9B9B9B',
    marginTop: 4,
  },
});
