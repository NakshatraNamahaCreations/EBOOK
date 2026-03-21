import React from 'react';
import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../src/store/store';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';
import { LoadingScreen } from '../src/components/layout/LoadingScreen';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AudioPlayerProvider } from '../src/context/AudioPlayerContext';

function AppStack() {
  const { colors } = useTheme();
  return (
     <SafeAreaProvider>

    
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="splash" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="verify-otp" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="book/[id]" options={{ title: 'Book Details', headerBackTitle: 'Back' }} />
      <Stack.Screen name="audiobook/[id]" options={{ title: 'Audiobook Details', headerBackTitle: 'Back' }} />
      <Stack.Screen name="podcast/[id]" options={{ title: 'Podcast Details', headerBackTitle: 'Back' }} />
      <Stack.Screen name="reader/[id]" options={{ title: 'Reader', headerShown: false }} />
      <Stack.Screen name="player/[id]" options={{ title: 'Player', headerShown: false }} />
      <Stack.Screen name="wallet" options={{ title: 'Wallet', headerBackTitle: 'Back' }} />
      <Stack.Screen name="subscription" options={{ title: 'Subscription', headerBackTitle: 'Back' }} />
      <Stack.Screen name="payment-success" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="payment-failure" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="profile/edit" options={{ title: 'Edit Profile', headerBackTitle: 'Back' }} />
      <Stack.Screen name="profile/notifications" options={{ title: 'Notifications', headerBackTitle: 'Back' }} />
      <Stack.Screen name="profile/theme" options={{ title: 'Theme', headerBackTitle: 'Back' }} />
      <Stack.Screen name="profile/language" options={{ title: 'Language', headerBackTitle: 'Back' }} />
      <Stack.Screen name="profile/help" options={{ title: 'Help & Support', headerBackTitle: 'Back' }} />
      <Stack.Screen name="profile/terms" options={{ title: 'Terms of Service', headerBackTitle: 'Back' }} />
      <Stack.Screen name="profile/privacy" options={{ title: 'Privacy Policy', headerBackTitle: 'Back' }} />
      <Stack.Screen name="profile/about" options={{ title: 'About', headerBackTitle: 'Back' }} />
      <Stack.Screen name="profile/referral" options={{ title: 'Refer & Earn', headerBackTitle: 'Back' }} />
      <Stack.Screen name="profile/change-password" options={{ title: 'Change Password', headerBackTitle: 'Back' }} />
    </Stack>
     </SafeAreaProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  if (!fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <ThemeProvider>
          <AudioPlayerProvider>
            <AppStack />
          </AudioPlayerProvider>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}
