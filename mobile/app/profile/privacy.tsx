import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { useTheme } from '../../src/theme/ThemeContext';

const SECTIONS = [
  { title: '1. Information We Collect', body: 'We collect information you provide directly, including your phone number (for OTP login), name, and profile preferences. We also collect usage data such as content you read or listen to, progress, and wallet transactions.' },
  { title: '2. How We Use Your Information', body: 'We use your information to: provide and personalize the App experience; process coin purchases and wallet transactions; send notifications (with your consent); improve our content recommendations; and comply with legal obligations.' },
  { title: '3. Data Sharing', body: 'We do not sell your personal information. We may share data with trusted service providers who assist in operating the App (e.g., cloud hosting, payment processors) under strict confidentiality agreements. We may disclose data when required by law.' },
  { title: '4. Phone Number & OTP', body: 'Your phone number is used solely for authentication via One-Time Password (OTP). We do not share your phone number with third parties for marketing purposes.' },
  { title: '5. Cookies & Tracking', body: 'The App uses device identifiers and analytics tools to understand usage patterns and improve performance. You can limit analytics tracking through your device settings.' },
  { title: '6. Data Retention', body: 'We retain your data for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data by contacting privacy@bookvault.app.' },
  { title: '7. Security', body: 'We implement industry-standard security measures including encryption in transit (HTTPS/TLS) and at rest. However, no method of transmission over the internet is 100% secure.' },
  { title: "8. Children's Privacy", body: 'BookVault is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us personal data, please contact us immediately.' },
  { title: '9. Your Rights', body: 'Depending on your location, you may have rights to access, correct, or delete your personal information. To exercise these rights, contact privacy@bookvault.app.' },
  { title: '10. Changes to This Policy', body: 'We may update this Privacy Policy periodically. We will notify you of significant changes through the App. Continued use after changes constitutes acceptance.' },
  { title: '11. Contact Us', body: 'For privacy-related questions or requests, contact: privacy@bookvault.app' },
];

export default function PrivacyScreen() {
  const { colors } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, paddingBottom: spacing.xl },
    lastUpdated: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.lg },
    section: { marginBottom: spacing.lg },
    heading: { ...typography.bodySmall, color: colors.text, fontWeight: '700' as const, marginBottom: 8 },
    body: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 22 },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>Last updated: January 1, 2025</Text>
        {SECTIONS.map((sec) => (
          <View key={sec.title} style={styles.section}>
            <Text style={styles.heading}>{sec.title}</Text>
            <Text style={styles.body}>{sec.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
