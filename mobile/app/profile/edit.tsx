import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User } from 'lucide-react-native';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { useAppDispatch } from '../../src/hooks/useAppDispatch';
import { useAppSelector } from '../../src/hooks/useAppSelector';
import { updateUser } from '../../src/store/slices/authSlice';
import api from '../../src/services/api';
import { useTheme } from '../../src/theme/ThemeContext';

export default function EditProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const { user } = useAppSelector((state) => state.auth);

  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const response = await api.put('/reader/profile', { name: name.trim() });
      const updated = (response.data as any)?.data;
      dispatch(updateUser({ name: updated?.name || name.trim() }));
      Alert.alert('Success', 'Profile updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, paddingTop: spacing.lg },
    avatarWrap: { alignItems: 'center', marginBottom: spacing.xl },
    avatar: {
      width: 88, height: 88, borderRadius: 44,
      backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { ...typography.h1, color: '#fff' },
    card: {
      backgroundColor: colors.backgroundCard, borderRadius: 16, overflow: 'hidden',
      borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg,
    },
    fieldWrap: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    label: {
      ...typography.caption, color: colors.textMuted, fontWeight: '600' as const,
      marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: 0.5,
    },
    inputRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.backgroundLight, borderRadius: 10, paddingHorizontal: 12, height: 48,
    },
    inputReadonly: { opacity: 0.6 },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, ...typography.body, color: colors.text },
    hint: { ...typography.caption, color: colors.textDim, marginTop: 6 },
    saveBtn: {
      backgroundColor: colors.primary, borderRadius: 14, height: 52,
      alignItems: 'center', justifyContent: 'center',
    },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: { ...typography.body, color: '#fff', fontWeight: '700' as const },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name ? name[0].toUpperCase() : '?'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Display Name</Text>
            <View style={styles.inputRow}>
              <User size={18} color={colors.textMuted} strokeWidth={2} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
                returnKeyType="done"
              />
            </View>
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Phone</Text>
            <View style={[styles.inputRow, styles.inputReadonly]}>
              <TextInput
                style={[styles.input, { color: colors.textMuted }]}
                value={user?.mobile_number ? `${user.country_code || ''} ${user.mobile_number}`.trim() : '—'}
                editable={false}
              />
            </View>
            <Text style={styles.hint}>Phone number cannot be changed.</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
