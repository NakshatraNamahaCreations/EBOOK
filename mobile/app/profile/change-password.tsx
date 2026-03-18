import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeContext';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { TextInput } from '../../src/components/inputs/TextInput';
import { Button } from '../../src/components/buttons/Button';
import { authService } from '../../src/services/auth.service';

export default function ChangePasswordScreen() {
  const { colors } = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!currentPassword) { Alert.alert('Error', 'Please enter your current password'); return; }
    if (newPassword.length < 6) { Alert.alert('Error', 'New password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { Alert.alert('Error', 'New passwords do not match'); return; }
    if (currentPassword === newPassword) { Alert.alert('Error', 'New password must be different from current'); return; }

    setLoading(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      Alert.alert('Success', 'Password changed successfully', [
        { text: 'OK', onPress: () => { setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); } },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to change password';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, gap: spacing.xs },
    hint: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <Text style={styles.hint}>Enter your current password, then choose a new one.</Text>
            <TextInput
              label="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              secureTextEntry
            />
            <TextInput
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Minimum 6 characters"
              secureTextEntry
            />
            <TextInput
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter new password"
              secureTextEntry
            />
            <Button
              title="Save Password"
              onPress={handleSave}
              loading={loading}
              fullWidth
              style={{ marginTop: spacing.sm }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
