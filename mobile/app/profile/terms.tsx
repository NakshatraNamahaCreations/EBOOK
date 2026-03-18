import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { useTheme } from '../../src/theme/ThemeContext';

const SECTIONS = [
  { title: '1. Acceptance of Terms', body: 'By downloading, installing, or using the Salil javeri application ("App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the App.' },
  { title: '2. Use of the App', body: 'Salil javeri grants you a limited, non-exclusive, non-transferable, revocable license to use the App for personal, non-commercial purposes. You may not copy, modify, distribute, sell, or lease any part of our services or included software.' },
  { title: '3. User Accounts', body: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately of any unauthorized use of your account.' },
  { title: '4. Coins & Payments', body: 'Coins are a virtual currency within the App. Coins have no real-world monetary value and cannot be exchanged for cash. Purchased coins are non-refundable except where required by applicable law. We reserve the right to modify coin prices at any time.' },
  { title: '5. Content', body: 'All books, audiobooks, podcasts, and other content available on Salil javeri are protected by intellectual property laws. You may access content for personal use only. Redistribution, sharing, or reproduction of content is strictly prohibited.' },
  { title: '6. Prohibited Conduct', body: 'You agree not to: (a) use the App for any unlawful purpose; (b) attempt to gain unauthorized access to any part of the App; (c) transmit any harmful or disruptive code; (d) harvest or collect user information.' },
  { title: '7. Termination', body: 'We reserve the right to suspend or terminate your account at any time, with or without notice, for conduct that violates these Terms or is otherwise harmful to the App, its users, or third parties.' },
  { title: '8. Disclaimer of Warranties', body: 'The App is provided "as is" without warranties of any kind. We do not guarantee that the App will be uninterrupted, error-free, or free of viruses or other harmful components.' },
  { title: '9. Limitation of Liability', body: 'To the fullest extent permitted by law, Salil javeri shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the App.' },
  { title: '10. Changes to Terms', body: 'We may update these Terms from time to time. Continued use of the App after changes constitutes your acceptance of the new Terms. We will notify you of significant changes via the App.' },
  { title: '11. Contact', body: 'If you have questions about these Terms, please contact us at legal@saliljaveri.app.' },
];

export default function TermsScreen() {
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
