import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, Star, Share2, Globe } from 'lucide-react-native';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { useTheme } from '../../src/theme/ThemeContext';

const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '100';

export default function AboutScreen() {
  const { colors } = useTheme();

  const openWebsite = () =>
    Linking.openURL('https://saliljaveri.com').catch(() =>
      Alert.alert('Error', 'Unable to open website.')
    );

  const rateApp = () =>
    Alert.alert('Rate Us', 'Redirecting to the app store to rate Salil javeri.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Rate Now', onPress: () => {} },
    ]);

  const shareApp = () =>
    Alert.alert('Share', 'Share Salil javeri with your friends!');

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, paddingBottom: spacing.xl },
    logoBlock: { alignItems: 'center', paddingVertical: spacing.xl, marginBottom: spacing.lg },
    logoWrap: {
      width: 88, height: 88, borderRadius: 24,
      backgroundColor: colors.backgroundCard,
      borderWidth: 1, borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
    },
    appName: { ...typography.h2, color: colors.text, marginBottom: 4 },
    tagline: { ...typography.bodySmall, color: colors.textSecondary, letterSpacing: 1 },
    versionBadge: {
      marginTop: spacing.sm, backgroundColor: colors.backgroundLight,
      paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
      borderWidth: 1, borderColor: colors.border,
    },
    versionText: { ...typography.caption, color: colors.textMuted },
    card: {
      backgroundColor: colors.backgroundCard, borderRadius: 16,
      borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: spacing.lg,
    },
    infoRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingVertical: 14, paddingHorizontal: spacing.md,
    },
    infoRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    infoLabel: { ...typography.bodySmall, color: colors.textSecondary },
    infoValue: { ...typography.bodySmall, color: colors.text, fontWeight: '600' as const },
    actionRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
    actionIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    actionText: { ...typography.body, color: colors.text, fontWeight: '500' as const },
    copyright: { ...typography.caption, color: colors.textDim, textAlign: 'center', lineHeight: 20 },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoBlock}>
          <View style={styles.logoWrap}>
            <BookOpen size={44} color={colors.primary} strokeWidth={1.5} />
          </View>
          <Text style={styles.appName}>Salil javeri</Text>
          <Text style={styles.tagline}>Read · Listen · Grow</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>v{APP_VERSION} · Build {BUILD_NUMBER}</Text>
          </View>
        </View>

        <View style={styles.card}>
          {[
            { label: 'Version', value: APP_VERSION },
            { label: 'Build', value: BUILD_NUMBER },
            { label: 'Platform', value: 'React Native / Expo' },
            { label: 'Released', value: 'January 2025' },
          ].map((row, idx, arr) => (
            <View key={row.label} style={[styles.infoRow, idx < arr.length - 1 && styles.infoRowBorder]}>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={styles.infoValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <TouchableOpacity style={[styles.actionRow, styles.infoRowBorder]} onPress={rateApp}>
            <View style={[styles.actionIcon, { backgroundColor: '#3a2e0a' }]}>
              <Star size={18} color="#FFE66D" strokeWidth={2} />
            </View>
            <Text style={styles.actionText}>Rate Salil javeri</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionRow, styles.infoRowBorder]} onPress={shareApp}>
            <View style={[styles.actionIcon, { backgroundColor: '#1e3a5f' }]}>
              <Share2 size={18} color="#60A5FA" strokeWidth={2} />
            </View>
            <Text style={styles.actionText}>Share with Friends</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow} onPress={openWebsite}>
            <View style={[styles.actionIcon, { backgroundColor: '#1a3d2e' }]}>
              <Globe size={18} color="#4ADE80" strokeWidth={2} />
            </View>
            <Text style={styles.actionText}>Visit Website</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.copyright}>
          © 2025 Salil javeri. All rights reserved.{'\n'}Made with ❤️ in India.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
