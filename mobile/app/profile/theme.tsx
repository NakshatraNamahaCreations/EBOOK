import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Moon, Sun } from 'lucide-react-native';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { useTheme, ThemeType } from '../../src/theme/ThemeContext';

const THEMES: { key: ThemeType; label: string; subtitle: string; Icon: any }[] = [
  { key: 'dark', label: 'Dark', subtitle: 'Dark background, easy on the eyes at night', Icon: Moon },
  { key: 'light', label: 'Light', subtitle: 'Bright background for daytime reading', Icon: Sun },
];

export default function ThemeScreen() {
  const { theme, colors, setTheme } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md },
    intro: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 22 },
    card: {
      backgroundColor: colors.backgroundCard,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      marginBottom: spacing.lg,
    },
    row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    iconWrap: {
      width: 44, height: 44, borderRadius: 12,
      backgroundColor: colors.backgroundLight,
      alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
    },
    iconWrapActive: { backgroundColor: colors.primary + '20' },
    rowText: { flex: 1 },
    rowTitle: { ...typography.body, color: colors.text, fontWeight: '600' as const },
    rowSub: { ...typography.caption, color: colors.textSecondary, marginTop: 3 },
    radio: {
      width: 24, height: 24, borderRadius: 12,
      borderWidth: 2, borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center',
    },
    radioActive: { borderColor: colors.primary, backgroundColor: colors.primary + '18' },
    note: { ...typography.caption, color: colors.textDim, textAlign: 'center', paddingHorizontal: spacing.md, lineHeight: 18 },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Choose how Salil javeri looks on your device.
        </Text>

        <View style={styles.card}>
          {THEMES.map((t, idx) => {
            const active = theme === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.row, idx < THEMES.length - 1 && styles.rowBorder]}
                onPress={() => setTheme(t.key)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
                  <t.Icon size={22} color={active ? colors.primary : colors.textMuted} strokeWidth={2} />
                </View>
                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, active && { color: colors.primary }]}>{t.label}</Text>
                  <Text style={styles.rowSub}>{t.subtitle}</Text>
                </View>
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active && <Check size={14} color={colors.primary} strokeWidth={3} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
