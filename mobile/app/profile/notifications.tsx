import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { useAppDispatch } from '../../src/hooks/useAppDispatch';
import { useAppSelector } from '../../src/hooks/useAppSelector';
import { updateUser } from '../../src/store/slices/authSlice';
import api from '../../src/services/api';
import { useTheme } from '../../src/theme/ThemeContext';

export default function NotificationsScreen() {
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const { user } = useAppSelector((state) => state.auth);

  const [enabled, setEnabled] = useState<boolean>(user?.preferences?.notifications !== false);
  const [saving, setSaving] = useState(false);

  const handleToggle = async (value: boolean) => {
    setEnabled(value);
    setSaving(true);
    try {
      await api.put('/reader/profile/preferences', { notifications: value });
      dispatch(updateUser({ preferences: { ...user?.preferences, notifications: value } }));
    } catch {
      Alert.alert('Error', 'Failed to save notification preference.');
      setEnabled(!value);
    } finally {
      setSaving(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.backgroundCard,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.lg,
    },
    rowText: { flex: 1, paddingRight: spacing.md },
    title: { ...typography.body, color: colors.text, fontWeight: '600' as const },
    subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 3 },
    note: {
      ...typography.caption,
      color: colors.textDim,
      textAlign: 'center',
      paddingHorizontal: spacing.md,
      lineHeight: 18,
    },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.title}>All Notifications</Text>
            <Text style={styles.subtitle}>Enable or disable all push notifications</Text>
          </View>
          {saving ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Switch
              value={enabled}
              onValueChange={handleToggle}
              trackColor={{ false: colors.backgroundLight, true: colors.primary + '80' }}
              thumbColor={enabled ? colors.primary : colors.textMuted}
            />
          )}
        </View>

        <Text style={styles.note}>
          Push notification permissions are managed through your device settings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
