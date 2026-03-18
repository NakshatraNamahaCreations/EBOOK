import React, { useMemo, useState } from 'react';
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
import { ChevronDown, ChevronUp, Mail, MessageCircle, Phone } from 'lucide-react-native';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { useTheme } from '../../src/theme/ThemeContext';

const FAQS = [
  { q: 'How do I purchase coins?', a: 'Go to Profile → Wallet and choose a coin pack that suits you. Tap "Purchase" to add coins to your wallet instantly.' },
  { q: 'How do I unlock a chapter or audiobook?', a: 'Open the book or audiobook, then tap the locked chapter. You will be prompted to unlock it using your coin balance.' },
  { q: 'Can I read books offline?', a: 'Chapters you have already opened are cached for offline reading. Full offline download support is coming soon.' },
  { q: 'How do I track my reading progress?', a: 'Your progress is saved automatically as you read. Visit the Library tab → In Progress to see all your active reads.' },
  { q: 'Why is my coin balance not updating?', a: 'Pull-to-refresh on the Wallet screen to sync your balance. If the issue persists, please contact support.' },
  { q: 'How do I cancel my subscription?', a: 'Subscriptions are managed through your app store account (Google Play / App Store). Visit your store subscriptions page to cancel.' },
  { q: 'I forgot my account details. What do I do?', a: 'Salil javeri uses phone-based OTP login — no password needed. Just enter your registered phone number to receive a new OTP.' },
];

function FaqItem({ q, a, colors, styles }: { q: string; a: string; colors: any; styles: any }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.faqItem}>
      <TouchableOpacity style={styles.faqHeader} onPress={() => setOpen((v) => !v)} activeOpacity={0.7}>
        <Text style={styles.faqQ}>{q}</Text>
        {open ? (
          <ChevronUp size={18} color={colors.textMuted} strokeWidth={2} />
        ) : (
          <ChevronDown size={18} color={colors.textMuted} strokeWidth={2} />
        )}
      </TouchableOpacity>
      {open && <Text style={styles.faqA}>{a}</Text>}
    </View>
  );
}

export default function HelpScreen() {
  const { colors } = useTheme();

  const openEmail = () =>
    Linking.openURL('mailto:support@saliljaveri.app').catch(() =>
      Alert.alert('Error', 'Unable to open email app.')
    );

  const openChat = () =>
    Alert.alert('Live Chat', 'Live chat support will be available in a future update. Please email us for now.');

  const openPhone = () =>
    Linking.openURL('tel:+911800000000').catch(() =>
      Alert.alert('Error', 'Unable to open phone app.')
    );

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, paddingBottom: spacing.xl },
    sectionLabel: {
      ...typography.caption, color: colors.textMuted, fontWeight: '600' as const,
      letterSpacing: 0.6, marginBottom: spacing.sm, marginTop: spacing.sm,
    },
    card: {
      backgroundColor: colors.backgroundCard, borderRadius: 16,
      borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: spacing.lg,
    },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    contactRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
    contactIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    contactText: { flex: 1 },
    contactTitle: { ...typography.body, color: colors.text, fontWeight: '600' as const },
    contactSub: { ...typography.caption, color: colors.textSecondary, marginTop: 3 },
    faqDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
    faqItem: { padding: spacing.md },
    faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    faqQ: { ...typography.bodySmall, color: colors.text, fontWeight: '600' as const, flex: 1, paddingRight: spacing.sm },
    faqA: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 22 },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>CONTACT US</Text>
        <View style={styles.card}>
          <TouchableOpacity style={[styles.contactRow, styles.rowBorder]} onPress={openEmail}>
            <View style={[styles.contactIcon, { backgroundColor: '#1e3a5f' }]}>
              <Mail size={20} color="#60A5FA" strokeWidth={2} />
            </View>
            <View style={styles.contactText}>
              <Text style={styles.contactTitle}>Email Support</Text>
              <Text style={styles.contactSub}>support@saliljaveri.app</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.contactRow, styles.rowBorder]} onPress={openChat}>
            <View style={[styles.contactIcon, { backgroundColor: '#1a3d2e' }]}>
              <MessageCircle size={20} color="#4ADE80" strokeWidth={2} />
            </View>
            <View style={styles.contactText}>
              <Text style={styles.contactTitle}>Live Chat</Text>
              <Text style={styles.contactSub}>Mon – Sat, 9 AM – 6 PM IST</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactRow} onPress={openPhone}>
            <View style={[styles.contactIcon, { backgroundColor: '#2d1f4a' }]}>
              <Phone size={20} color="#A78BFA" strokeWidth={2} />
            </View>
            <View style={styles.contactText}>
              <Text style={styles.contactTitle}>Phone Support</Text>
              <Text style={styles.contactSub}>1800-000-0000 (Toll free)</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>FREQUENTLY ASKED QUESTIONS</Text>
        <View style={styles.card}>
          {FAQS.map((item, idx) => (
            <View key={idx} style={idx < FAQS.length - 1 ? styles.faqDivider : undefined}>
              <FaqItem q={item.q} a={item.a} colors={colors} styles={styles} />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
