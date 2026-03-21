import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  TextInput as RNTextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput } from '../src/components/inputs/TextInput';
import { Button } from '../src/components/buttons/Button';
import { useTheme } from '../src/theme/ThemeContext';
import { authService } from '../src/services/auth.service';
import { typography } from '../src/theme/typography';
import { spacing } from '../src/theme/spacing';

type Step = 'email' | 'otp' | 'password';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [step, setStep] = useState<Step>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Step 1 — email
  const [email, setEmail] = useState('');

  // Step 2 — OTP (6 boxes)
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(RNTextInput | null)[]>([]);
  const [resetToken, setResetToken] = useState('');

  // Step 3 — new password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const clearError = () => setError('');

  // ── Step 1: Request OTP ─────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    clearError();
    if (!email.trim()) { setError('Email address is required'); return; }
    if (!EMAIL_REGEX.test(email.trim())) { setError('Please enter a valid email address'); return; }

    setLoading(true);
    try {
      await authService.forgotPasswordOTP(email.trim().toLowerCase());
      setStep('otp');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ──────────────────────────────────────────────────────
  const otpValue = otp.join('');

  const handleOTPChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const updated = [...otp];
    updated[index] = digit;
    setOtp(updated);
    clearError();
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    clearError();
    if (otpValue.length < 6) { setError('Please enter the 6-digit OTP'); return; }

    setLoading(true);
    try {
      const result = await authService.verifyForgotPasswordOTP(email.trim().toLowerCase(), otpValue);
      setResetToken(result.resetToken);
      setStep('password');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    clearError();
    setOtp(['', '', '', '', '', '']);
    setLoading(true);
    try {
      await authService.forgotPasswordOTP(email.trim().toLowerCase());
      setSuccessMsg('A new OTP has been sent to your email.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Reset password ──────────────────────────────────────────────────
  const handleResetPassword = async () => {
    clearError();
    if (!newPassword) { setError('New password is required'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      await authService.resetPassword(resetToken, newPassword);
      router.replace('/login');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
    backBtn: { marginTop: spacing.md, marginBottom: spacing.sm },
    backBtnText: { ...typography.body, color: colors.primary },
    header: { alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.xl },
    icon: { fontSize: 52, marginBottom: spacing.md },
    title: { ...typography.h2, color: colors.text, marginBottom: spacing.xs, textAlign: 'center' },
    subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.md },
    form: { gap: spacing.sm },
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
    successBox: {
      backgroundColor: 'rgba(34,197,94,0.12)',
      borderRadius: 10,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: 'rgba(34,197,94,0.3)',
    },
    successText: { ...typography.bodySmall, color: '#22C55E', textAlign: 'center' },
    stepIndicator: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.xs,
      marginBottom: spacing.xl,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
    },
    dotActive: { backgroundColor: colors.primary, width: 24 },
    // OTP boxes
    otpRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginVertical: spacing.md },
    otpBox: {
      width: 48,
      height: 56,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.backgroundCard,
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 22,
      fontWeight: '700' as const,
      color: colors.text,
      textAlign: 'center',
    },
    otpBoxFilled: { borderColor: colors.primary },
    resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.sm },
    resendText: { ...typography.bodySmall, color: colors.textSecondary },
    resendLink: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' as const },
    emailHint: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.md },
  }), [colors]);

  const stepIndex = step === 'email' ? 0 : step === 'otp' ? 1 : 2;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => step === 'email' ? router.back() : setStep(step === 'otp' ? 'email' : 'otp')}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>

          {/* Step indicator */}
          <View style={styles.stepIndicator}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.dot, i === stepIndex && styles.dotActive]} />
            ))}
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.icon}>{step === 'email' ? '📧' : step === 'otp' ? '🔐' : '🔒'}</Text>
            <Text style={styles.title}>
              {step === 'email' ? 'Forgot Password?' : step === 'otp' ? 'Enter OTP' : 'New Password'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'email'
                ? 'Enter your registered email and we\'ll send you a verification code.'
                : step === 'otp'
                ? `A 6-digit OTP was sent to\n${email}`
                : 'Create a new strong password for your account.'}
            </Text>
          </View>

          {/* Error / Success */}
          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          {!!successMsg && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{successMsg}</Text>
            </View>
          )}

          {/* ── Step 1: Email ─────────────────────────────────────────── */}
          {step === 'email' && (
            <View style={styles.form}>
              <TextInput
                label="Email Address *"
                value={email}
                onChangeText={(v) => { setEmail(v); clearError(); }}
                placeholder="Enter your registered email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              <Button
                title="Send OTP"
                onPress={handleSendOTP}
                loading={loading}
                fullWidth
                style={{ marginTop: spacing.sm }}
              />
            </View>
          )}

          {/* ── Step 2: OTP ───────────────────────────────────────────── */}
          {step === 'otp' && (
            <View style={styles.form}>
              <Text style={styles.emailHint}>Check your inbox for the OTP</Text>
              <View style={styles.otpRow}>
                {otp.map((digit, i) => (
                  <RNTextInput
                    key={i}
                    ref={(ref) => { otpRefs.current[i] = ref; }}
                    style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                    value={digit}
                    onChangeText={(t) => handleOTPChange(t, i)}
                    onKeyPress={({ nativeEvent }) => handleOTPKeyPress(nativeEvent.key, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    textAlign="center"
                  />
                ))}
              </View>
              <Button
                title="Verify OTP"
                onPress={handleVerifyOTP}
                loading={loading}
                fullWidth
                style={{ marginTop: spacing.sm }}
              />
              <View style={styles.resendRow}>
                <Text style={styles.resendText}>Didn't receive it? </Text>
                <TouchableOpacity onPress={handleResendOTP} disabled={loading}>
                  <Text style={styles.resendLink}>Resend OTP</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── Step 3: New Password ──────────────────────────────────── */}
          {step === 'password' && (
            <View style={styles.form}>
              <TextInput
                label="New Password *"
                value={newPassword}
                onChangeText={(v) => { setNewPassword(v); clearError(); }}
                placeholder="Minimum 6 characters"
                secureTextEntry
              />
              <TextInput
                label="Confirm New Password *"
                value={confirmPassword}
                onChangeText={(v) => { setConfirmPassword(v); clearError(); }}
                placeholder="Re-enter new password"
                secureTextEntry
              />
              <Button
                title="Reset Password"
                onPress={handleResetPassword}
                loading={loading}
                fullWidth
                style={{ marginTop: spacing.sm }}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
