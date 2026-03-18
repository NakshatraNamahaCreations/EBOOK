import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  ActivityIndicator,
  Clipboard,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Gift,
  Copy,
  Share2,
  Users,
  CheckCircle,
  Clock,
  Star,
} from 'lucide-react-native';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { useTheme } from '../../src/theme/ThemeContext';
import { referralService, ReferralData, ReferralEntry } from '../../src/services/referral.service';

const APP_LINK = 'https://saliljaveri.app';

const StatBox = ({
  icon: Icon,
  label,
  value,
  iconColor,
  iconBg,
  colors,
  styles,
}: {
  icon: any;
  label: string;
  value: string | number;
  iconColor: string;
  iconBg: string;
  colors: any;
  styles: any;
}) => (
  <View style={styles.statBox}>
    <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
      <Icon size={18} color={iconColor} strokeWidth={2} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const ReferralRow = ({
  item,
  colors,
  styles,
}: {
  item: ReferralEntry;
  colors: any;
  styles: any;
}) => {
  const name = item.refereeId?.name || item.refereeId?.email || 'Unknown User';
  const initial = name.charAt(0).toUpperCase();
  const isCompleted = item.status === 'completed';

  return (
    <View style={styles.referralRow}>
      <View style={styles.referralAvatar}>
        <Text style={styles.referralAvatarText}>{initial}</Text>
      </View>
      <View style={styles.referralInfo}>
        <Text style={styles.referralName}>{name}</Text>
        <Text style={styles.referralDate}>
          {new Date(item.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </Text>
      </View>
      <View style={[styles.statusBadge, isCompleted ? styles.statusSuccess : styles.statusPending]}>
        {isCompleted ? (
          <CheckCircle size={12} color="#10b981" strokeWidth={2.5} />
        ) : (
          <Clock size={12} color="#f59e0b" strokeWidth={2.5} />
        )}
        <Text style={[styles.statusText, { color: isCompleted ? '#10b981' : '#f59e0b' }]}>
          {isCompleted ? 'Joined' : 'Pending'}
        </Text>
      </View>
    </View>
  );
};

export default function ReferralScreen() {
  const { colors } = useTheme();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await referralService.getMyReferrals();
      setData(result);
    } catch {
      Alert.alert('Error', 'Failed to load referral data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCopy = () => {
    if (!data?.referralCode) return;
    Clipboard.setString(data.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!data?.referralCode) return;
    try {
      await Share.share({
        message: `Join me on Salil javeri — the best app to read, listen & grow! Use my invite code *${data.referralCode}* to get started.\n\n${APP_LINK}`,
        title: 'Invite to Salil javeri',
      });
    } catch { /* user dismissed */ }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    content: { padding: spacing.md, paddingBottom: 40 },

    // Hero card
    heroCard: {
      backgroundColor: colors.backgroundCard,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    heroIcon: {
      width: 64, height: 64, borderRadius: 32,
      backgroundColor: '#1a2a1a',
      alignItems: 'center', justifyContent: 'center',
      marginBottom: spacing.md,
    },
    heroTitle: { ...typography.h2, color: colors.text, textAlign: 'center', marginBottom: 6 },
    heroSub: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: spacing.lg,
    },

    // Code box
    codeBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundLight,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 14,
      paddingHorizontal: spacing.md,
      width: '100%',
      marginBottom: spacing.md,
    },
    code: {
      flex: 1,
      ...typography.h2,
      color: colors.primary,
      letterSpacing: 4,
      textAlign: 'center',
    },
    copyBtn: {
      paddingLeft: spacing.sm,
    },

    // Share button
    shareBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: spacing.xl,
      width: '100%',
    },
    shareBtnText: {
      ...typography.body,
      color: '#fff',
      fontWeight: '700' as const,
    },

    // Stats
    statsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    statBox: {
      flex: 1,
      backgroundColor: colors.backgroundCard,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      alignItems: 'center',
    },
    statIcon: {
      width: 36, height: 36, borderRadius: 18,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 6,
    },
    statValue: { ...typography.h2, color: colors.text, marginBottom: 2 },
    statLabel: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },

    // Referral list
    sectionTitle: {
      ...typography.body,
      color: colors.textMuted,
      fontWeight: '700' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: 1,
      marginBottom: spacing.sm,
    },
    listCard: {
      backgroundColor: colors.backgroundCard,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden' as const,
    },
    emptyBox: { padding: spacing.xl, alignItems: 'center' },
    emptyText: { ...typography.body, color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' },

    referralRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    referralAvatar: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: colors.backgroundLight,
      alignItems: 'center', justifyContent: 'center',
      marginRight: spacing.md,
    },
    referralAvatarText: { ...typography.body, color: colors.primary, fontWeight: '700' as const },
    referralInfo: { flex: 1 },
    referralName: { ...typography.body, color: colors.text },
    referralDate: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 20,
    },
    statusSuccess: { backgroundColor: 'rgba(16,185,129,0.12)' },
    statusPending: { backgroundColor: 'rgba(245,158,11,0.12)' },
    statusText: { ...typography.caption, fontWeight: '600' as const },

    // Rewards hint
    rewardHint: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: 'rgba(255,230,109,0.08)',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,230,109,0.2)',
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    rewardHintText: { ...typography.bodySmall, color: colors.accent, flex: 1, lineHeight: 18 },
  }), [colors]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const referralCode = data?.referralCode || '--------';
  const stats = data?.stats || { total: 0, successful: 0, pending: 0, totalRewards: 0 };
  const referrals = data?.referrals || [];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Gift size={28} color="#4ADE80" strokeWidth={1.5} />
          </View>
          <Text style={styles.heroTitle}>Invite & Earn</Text>
          <Text style={styles.heroSub}>
            Share your referral code with friends.{'\n'}
            Both of you get rewarded when they join!
          </Text>

          {/* Code */}
          <View style={styles.codeBox}>
            <Text style={styles.code}>{referralCode}</Text>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
              <Copy size={20} color={copied ? '#4ADE80' : colors.textMuted} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Share */}
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Share2 size={18} color="#fff" strokeWidth={2} />
            <Text style={styles.shareBtnText}>Share Invite Link</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatBox icon={Users} label="Invited" value={stats.total}
            iconColor="#60A5FA" iconBg="rgba(96,165,250,0.12)" colors={colors} styles={styles} />
          <StatBox icon={CheckCircle} label="Joined" value={stats.successful}
            iconColor="#4ADE80" iconBg="rgba(74,222,128,0.12)" colors={colors} styles={styles} />
          <StatBox icon={Star} label="Coins Earned" value={stats.totalRewards > 0 ? `${stats.totalRewards}` : '0'}
            iconColor="#FFE66D" iconBg="rgba(255,230,109,0.12)" colors={colors} styles={styles} />
        </View>

        {/* Reward hint */}
        <View style={styles.rewardHint}>
          <Star size={16} color="#FFE66D" strokeWidth={2} />
          <Text style={styles.rewardHintText}>
            Earn <Text style={{ fontWeight: '800', color: '#FFE66D' }}>10 coins</Text> every time a friend signs up using your referral code.
          </Text>
        </View>

        {/* Referral history */}
        <Text style={styles.sectionTitle}>Referral History</Text>
        <View style={styles.listCard}>
          {referrals.length === 0 ? (
            <View style={styles.emptyBox}>
              <Users size={32} color={colors.textDim} strokeWidth={1.5} />
              <Text style={styles.emptyText}>
                No referrals yet.{'\n'}Share your code and start earning!
              </Text>
            </View>
          ) : (
            referrals.map((item, idx) => (
              <ReferralRow
                key={item._id}
                item={item}
                colors={colors}
                styles={styles}
              />
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
