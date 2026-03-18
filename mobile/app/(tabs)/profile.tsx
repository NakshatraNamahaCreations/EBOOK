import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Wallet,
  UserCircle,
  Bell,
  Moon,
  Globe,
  HelpCircle,
  FileText,
  ShieldCheck,
  Info,
  LogOut,
  ChevronRight,
  Gift,
  Lock,
} from 'lucide-react-native';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { useAppDispatch } from '../../src/hooks/useAppDispatch';
import { useAppSelector } from '../../src/hooks/useAppSelector';
import { resetStore } from '../../src/store/store';
import { authService } from '../../src/services/auth.service';
import { useTheme } from '../../src/theme/ThemeContext';

const LANG_LABELS: Record<string, string> = {
  en: 'English', hi: 'Hindi', mr: 'Marathi', gu: 'Gujarati',
  ta: 'Tamil', te: 'Telugu', kn: 'Kannada', bn: 'Bengali',
  ml: 'Malayalam', pa: 'Punjabi',
};

interface MenuItemProps {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showChevron?: boolean;
  colors: any;
  styles: any;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon: IconComponent, title, subtitle, onPress, showChevron = true, colors, styles }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuItemLeft}>
      <View style={styles.iconContainer}>
        <IconComponent size={22} color={colors.primary} strokeWidth={2} />
      </View>
      <View>
        <Text style={styles.menuItemTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
      </View>
    </View>
    {showChevron && <ChevronRight size={20} color={colors.textMuted} strokeWidth={2} />}
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const { user } = useAppSelector((state) => state.auth);

  const langLabel = LANG_LABELS[user?.preferences?.language || 'en'] || 'English';

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            // Clear everything first
            await authService.logout();   // storage
            dispatch(resetStore());       // Redux
            
            // Then navigate
            router.replace('/login');
          } catch (error) {
            console.error('Logout error:', error);
            // Fallback: navigate anyway to unstick the user
            router.replace('/login');
          }
        },
      },
    ]);
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    avatarContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    avatarText: { ...typography.h1, color: '#fff' },
    name: { ...typography.h2, color: colors.text, marginBottom: 4 },
    phone: { ...typography.body, color: colors.textSecondary },
    premiumBadge: {
      backgroundColor: colors.premium,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 20,
      marginTop: spacing.md,
    },
    premiumText: { ...typography.bodySmall, color: colors.background, fontWeight: 'bold' as const },
    section: { marginTop: spacing.lg },
    sectionTitle: {
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: '600' as const,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.backgroundCard,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.backgroundLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    menuItemTitle: { ...typography.body, color: colors.text },
    menuItemSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/profile/edit')}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {user?.name ? user.name[0].toUpperCase() : '👤'}
              </Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{user?.name || 'User'}</Text>
          <Text style={styles.phone}>{user?.email || user?.mobile_number || ''}</Text>
          {user?.is_premium && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumText}>⭐ Premium Member</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <MenuItem icon={Wallet} title="Wallet" subtitle={`${user?.coin_balance || 0} coins available`} onPress={() => router.push('/wallet')} colors={colors} styles={styles} />
          <MenuItem icon={Gift} title="Refer & Earn" subtitle="Invite friends and get rewarded" onPress={() => router.push('/profile/referral')} colors={colors} styles={styles} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SETTINGS</Text>
          <MenuItem icon={UserCircle} title="Edit Profile" onPress={() => router.push('/profile/edit')} colors={colors} styles={styles} />
          <MenuItem icon={Lock} title="Change Password" onPress={() => router.push('/profile/change-password')} colors={colors} styles={styles} />
          <MenuItem icon={Bell} title="Notifications" onPress={() => router.push('/profile/notifications')} colors={colors} styles={styles} />
          <MenuItem icon={Moon} title="Theme" subtitle="Dark / Light" onPress={() => router.push('/profile/theme')} colors={colors} styles={styles} />
          <MenuItem icon={Globe} title="Language" subtitle={langLabel} onPress={() => router.push('/profile/language')} colors={colors} styles={styles} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUPPORT</Text>
          <MenuItem icon={HelpCircle} title="Help & Support" onPress={() => router.push('/profile/help')} colors={colors} styles={styles} />
          <MenuItem icon={FileText} title="Terms of Service" onPress={() => router.push('/profile/terms')} colors={colors} styles={styles} />
          <MenuItem icon={ShieldCheck} title="Privacy Policy" onPress={() => router.push('/profile/privacy')} colors={colors} styles={styles} />
          <MenuItem icon={Info} title="About" subtitle="Version 1.0.0" onPress={() => router.push('/profile/about')} colors={colors} styles={styles} />
        </View>

        <View style={styles.section}>
          <MenuItem icon={LogOut} title="Logout" onPress={handleLogout} showChevron={false} colors={colors} styles={styles} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
