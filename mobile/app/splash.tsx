import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { authService } from '../src/services/auth.service';
import { useAppDispatch } from '../src/hooks/useAppDispatch';
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
        await authService.logout(); // clear storage
        dispatch(resetStore());     // clear Redux
      }
      setTimeout(() => {
        router.replace(valid ? '/(tabs)/home' : '/onboarding');
      }, 2000);
    } catch (error) {
      setTimeout(() => {
        router.replace('/onboarding');
      }, 2000);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>📚</Text>
      <Text style={styles.title}>ContentHub</Text>
      <Text style={styles.subtitle}>Books, Audiobooks & Podcasts</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
