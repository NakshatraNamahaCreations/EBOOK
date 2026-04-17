import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch } from '../src/hooks/useAppDispatch';
import { setUser } from '../src/store/slices/authSlice';
import { TextInput } from '../src/components/inputs/TextInput';
import { Button } from '../src/components/buttons/Button';
import { useTheme } from '../src/theme/ThemeContext';
import { authService } from '../src/services/auth.service';
import { typography } from '../src/theme/typography';
import { spacing } from '../src/theme/spacing';

type Tab = 'login' | 'signup';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10}$/;

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();

  const [tab, setTab] = useState<Tab>('login');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Login fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // Signup fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const switchTab = (t: Tab) => {
    setTab(t);
    setFormError('');
  };

  const handleLogin = async () => {
    setFormError('');
    if (!identifier.trim()) { setFormError('Email or phone number is required'); return; }
    if (!password) { setFormError('Password is required'); return; }

    setLoading(true);
    try {
      const result = await authService.login(identifier.trim(), password);
      dispatch(setUser(result.user));
      router.replace('/(tabs)/home');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Invalid credentials';
      setFormError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setFormError('');

    if (!name.trim()) { setFormError('Full name is required'); return; }
    if (!phone.trim()) { setFormError('Phone number is required'); return; }
    if (!PHONE_REGEX.test(phone.trim())) { setFormError('Please enter a valid 10-digit mobile number'); return; }
    if (!email.trim()) { setFormError('Email address is required'); return; }
    if (!EMAIL_REGEX.test(email.trim())) { setFormError('Please enter a valid email address'); return; }
    if (!signupPassword) { setFormError('Password is required'); return; }
    if (signupPassword.length < 6) { setFormError('Password must be at least 6 characters'); return; }
    if (!confirmPassword) { setFormError('Please confirm your password'); return; }
    if (signupPassword !== confirmPassword) { setFormError('Passwords do not match'); return; }

    setLoading(true);
    try {
      const result = await authService.register(
        name.trim(),
        phone.trim(),
        email.trim().toLowerCase(),
        signupPassword,
        referralCode.trim() || undefined,
      );
      dispatch(setUser(result.user));
      router.replace('/(tabs)/home');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Registration failed';
      setFormError(msg);
    } finally {
      setLoading(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
    header: { alignItems: 'center', marginTop: spacing.xxl, marginBottom: spacing.xl },
    icon: { fontSize: 56, marginBottom: spacing.md },
    title: { ...typography.h1, color: colors.text, marginBottom: spacing.xs },
    subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
    tabRow: {
      flexDirection: 'row',
      backgroundColor: colors.backgroundCard,
      borderRadius: 14,
      padding: 4,
      marginBottom: spacing.lg,
    },
    tab: {
      flex: 1,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      borderRadius: 10,
    },
    activeTab: { backgroundColor: colors.primary },
    tabText: { ...typography.bodySmall, color: colors.textSecondary, fontWeight: '600' as const },
    activeTabText: { color: '#fff' },
    form: { gap: spacing.xs },
    errorBox: {
      backgroundColor: 'rgba(239,68,68,0.12)',
      borderRadius: 10,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: 'rgba(239,68,68,0.3)',
    },
    errorText: { ...typography.bodySmall, color: '#EF4444', textAlign: 'center' },
    terms: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
    forgotRow: { alignItems: 'flex-end', marginTop: -spacing.xs },
    forgotText: { ...typography.bodySmall, color: colors.primary },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.icon}>📚</Text>
            <Text style={styles.title}>{tab === 'login' ? 'Welcome Back' : 'Create Account'}</Text>
            <Text style={styles.subtitle}>
              {tab === 'login' ? 'Sign in to continue reading' : 'Join us and start exploring'}
            </Text>
          </View>

          {/* Tab switcher */}
          <View style={styles.tabRow}>
            <TouchableOpacity style={[styles.tab, tab === 'login' && styles.activeTab]} onPress={() => switchTab('login')}>
              <Text style={[styles.tabText, tab === 'login' && styles.activeTabText]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, tab === 'signup' && styles.activeTab]} onPress={() => switchTab('signup')}>
              <Text style={[styles.tabText, tab === 'signup' && styles.activeTabText]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Inline error */}
          {!!formError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{formError}</Text>
            </View>
          )}

          {tab === 'login' ? (
            <View style={styles.form}>
              <TextInput
                label="Email or Phone Number *"
                value={identifier}
                onChangeText={(v) => { setIdentifier(v); setFormError(''); }}
                placeholder="Enter email or phone"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                label="Password *"
                value={password}
                onChangeText={(v) => { setPassword(v); setFormError(''); }}
                placeholder="Enter password"
                secureTextEntry
              />
              <TouchableOpacity style={styles.forgotRow} onPress={() => router.push('/forgot-password')}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
              <Button
                title="Login"
                onPress={handleLogin}
                loading={loading}
                fullWidth
                style={{ marginTop: spacing.sm }}
              />
            </View>
          ) : (
            <View style={styles.form}>
              <TextInput
                label="Full Name *"
                value={name}
                onChangeText={(v) => { setName(v); setFormError(''); }}
                placeholder="Enter your full name"
                autoCapitalize="words"
              />
              <TextInput
                label="Phone Number *"
                value={phone}
                onChangeText={(v) => { setPhone(v.replace(/\D/g, '').slice(0, 10)); setFormError(''); }}
                placeholder="Enter 10-digit mobile number"
                keyboardType="number-pad"
                maxLength={10}
              />
              <TextInput
                label="Email Address *"
                value={email}
                onChangeText={(v) => { setEmail(v); setFormError(''); }}
                placeholder="example@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                label="Password *"
                value={signupPassword}
                onChangeText={(v) => { setSignupPassword(v); setFormError(''); }}
                placeholder="Minimum 6 characters"
                secureTextEntry
              />
              <TextInput
                label="Confirm Password *"
                value={confirmPassword}
                onChangeText={(v) => { setConfirmPassword(v); setFormError(''); }}
                placeholder="Re-enter your password"
                secureTextEntry
              />
              <TextInput
                label="Referral Code (optional)"
                value={referralCode}
                onChangeText={(v) => setReferralCode(v.toUpperCase())}
                placeholder="Enter invite code"
                autoCapitalize="characters"
                maxLength={8}
              />
              <Button
                title="Create Account"
                onPress={handleSignup}
                loading={loading}
                fullWidth
                style={{ marginTop: spacing.sm }}
              />
            </View>
          )}

          <Text style={styles.terms}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
