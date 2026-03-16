import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { useAppDispatch } from '../../src/hooks/useAppDispatch';
import { useAppSelector } from '../../src/hooks/useAppSelector';
import { updateUser } from '../../src/store/slices/authSlice';
import api from '../../src/services/api';
import { useTheme } from '../../src/theme/ThemeContext';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
];

export default function LanguageScreen() {
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const { user } = useAppSelector((state) => state.auth);
  const currentLang: string = user?.preferences?.language || 'en';

  const [selected, setSelected] = useState(currentLang);
  const [saving, setSaving] = useState(false);

  const handleSelect = async (code: string) => {
    if (code === selected) return;
    setSelected(code);
    setSaving(true);
    try {
      await api.put('/reader/profile/preferences', { language: code });
      dispatch(updateUser({ preferences: { ...user?.preferences, language: code } }));
    } catch {
      Alert.alert('Error', 'Failed to save language preference.');
      setSelected(selected);
    } finally {
      setSaving(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md },
    intro: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 22 },
    savingBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: colors.backgroundCard, borderRadius: 10,
      paddingVertical: 10, paddingHorizontal: spacing.md,
      marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
    },
    savingText: { ...typography.bodySmall, color: colors.textSecondary },
    card: {
      backgroundColor: colors.backgroundCard, borderRadius: 16,
      borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
    },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: spacing.md },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    rowText: { flex: 1 },
    rowTitle: { ...typography.body, color: colors.text, fontWeight: '600' as const },
    rowNative: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    checkWrap: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: colors.primary + '18',
      alignItems: 'center', justifyContent: 'center',
    },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Choose your preferred language for content discovery.
        </Text>

        {saving && (
          <View style={styles.savingBanner}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.savingText}>Saving…</Text>
          </View>
        )}

        <View style={styles.card}>
          {LANGUAGES.map((lang, idx) => {
            const active = selected === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.row, idx < LANGUAGES.length - 1 && styles.rowBorder]}
                onPress={() => handleSelect(lang.code)}
                activeOpacity={0.7}
                disabled={saving}
              >
                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, active && { color: colors.primary }]}>
                    {lang.label}
                  </Text>
                  <Text style={styles.rowNative}>{lang.native}</Text>
                </View>
                {active && (
                  <View style={styles.checkWrap}>
                    <Check size={18} color={colors.primary} strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
