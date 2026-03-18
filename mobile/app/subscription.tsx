import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { typography } from '../src/theme/typography';
import { spacing } from '../src/theme/spacing';
import { useAppSelector } from '../src/hooks/useAppSelector';
import { Button } from '../src/components/buttons/Button';
import { useTheme } from '../src/theme/ThemeContext';

const { width } = Dimensions.get('window');

const plans = [
  {
    name: 'Monthly',
    price: '₹249',
    rawPrice: 249,
    period: '/month',
    description: 'Great for trying out',
    features: [
      'Unlimited premium content',
      'Ad-free experience',
      'Download for offline',
      'Early access to new releases',
      'HD audio quality',
    ],
  },
  {
    name: 'Yearly',
    price: '₹1,999',
    rawPrice: 1999,
    period: '/year',
    description: 'Best value for readers',
    savings: 'Save 33%',
    popular: true,
    monthlyEquiv: '₹167/mo',
    features: [
      'Everything in Monthly',
      'Save ₹989 per year',
      'Priority customer support',
      'Exclusive member events',
      'Gift subscriptions',
    ],
  },
];

const ACCENT = '#4ADE80';
const ACCENT_DARK = '#22C55E';

export default function SubscriptionScreen() {
  const { user } = useAppSelector((state) => state.auth);
  const { colors, theme } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState(1);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSubscribe = () => {
    Alert.alert(
      'Subscribe',
      `Subscribe to ${plans[selectedPlan].name} plan for ${plans[selectedPlan].price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: () =>
            Alert.alert('Success', 'Subscription activated! (Mock)'),
        },
      ]
    );
  };

  const isDark = theme === 'dark';
  const cardBg = isDark ? '#1E1E24' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const selectedBorder = colors.primary;
  const checkColor = ACCENT;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        scrollContent: {
          paddingBottom: 40,
        },

        /* ── Hero Section ── */
        heroSection: {
          alignItems: 'center',
          paddingTop: spacing.xl + 8,
          paddingBottom: spacing.lg,
          paddingHorizontal: spacing.lg,
        },
        crownContainer: {
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: isDark
            ? 'rgba(74,222,128,0.12)'
            : 'rgba(74,222,128,0.1)',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.md + 4,
        },
        crownIcon: {
          fontSize: 36,
        },
        title: {
          fontSize: 28,
          fontWeight: '800',
          color: colors.text,
          letterSpacing: -0.5,
          marginBottom: 6,
        },
        subtitle: {
          fontSize: 15,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 22,
          maxWidth: 280,
        },

        /* ── Premium Badge ── */
        premiumBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: spacing.md,
          backgroundColor: isDark
            ? 'rgba(74,222,128,0.12)'
            : 'rgba(74,222,128,0.08)',
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 20,
          gap: 6,
        },
        premiumBadgeText: {
          fontSize: 14,
          color: ACCENT_DARK,
          fontWeight: '700',
        },

        /* ── Plan Cards ── */
        plansSection: {
          paddingHorizontal: spacing.md,
          gap: 14,
          marginTop: spacing.sm,
        },
        planCard: {
          backgroundColor: cardBg,
          borderRadius: 20,
          borderWidth: 2,
          borderColor: cardBorder,
          padding: 20,
          overflow: 'hidden',
        },
        planCardSelected: {
          borderColor: selectedBorder,
          backgroundColor: isDark ? '#1A1F2E' : '#F0F7FF',
        },

        /* Popular banner */
        popularStrip: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 28,
          alignItems: 'center',
          justifyContent: 'center',
        },
        popularStripText: {
          fontSize: 11,
          fontWeight: '800',
          color: '#FFFFFF',
          letterSpacing: 1.2,
        },
        planContentWithBanner: {
          marginTop: 16,
        },

        /* Plan header row */
        planTopRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 4,
        },
        planName: {
          fontSize: 18,
          fontWeight: '700',
          color: colors.text,
        },
        savingsPill: {
          backgroundColor: isDark
            ? 'rgba(74,222,128,0.15)'
            : 'rgba(74,222,128,0.12)',
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 8,
        },
        savingsText: {
          fontSize: 12,
          fontWeight: '800',
          color: ACCENT_DARK,
        },
        planDescription: {
          fontSize: 13,
          color: colors.textSecondary,
          marginBottom: 14,
        },

        /* Price */
        priceRow: {
          flexDirection: 'row',
          alignItems: 'baseline',
          marginBottom: 6,
        },
        priceSymbol: {
          fontSize: 22,
          fontWeight: '700',
          color: colors.text,
          marginRight: 2,
        },
        priceAmount: {
          fontSize: 38,
          fontWeight: '800',
          color: colors.text,
          letterSpacing: -1,
        },
        pricePeriod: {
          fontSize: 14,
          color: colors.textSecondary,
          marginLeft: 4,
          fontWeight: '500',
        },
        monthlyEquiv: {
          fontSize: 13,
          color: colors.primary,
          fontWeight: '600',
          marginBottom: 16,
        },

        /* Divider */
        divider: {
          height: 1,
          backgroundColor: isDark
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(0,0,0,0.06)',
          marginBottom: 14,
        },

        /* Features */
        featuresList: {
          gap: 10,
        },
        featureRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        },
        featureCheckCircle: {
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: isDark
            ? 'rgba(74,222,128,0.12)'
            : 'rgba(74,222,128,0.1)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        featureText: {
          fontSize: 14,
          color: colors.textSecondary,
          flex: 1,
          lineHeight: 20,
        },

        /* Radio indicator */
        radioOuter: {
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: cardBorder,
          alignItems: 'center',
          justifyContent: 'center',
        },
        radioOuterSelected: {
          borderColor: colors.primary,
        },
        radioInner: {
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: colors.primary,
        },

        /* ── Bottom CTA ── */
        ctaSection: {
          paddingHorizontal: spacing.md,
          paddingTop: spacing.lg + 4,
          paddingBottom: spacing.md,
        },
        ctaButton: {
          height: 56,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        ctaButtonText: {
          fontSize: 16,
          fontWeight: '700',
          color: '#FFFFFF',
          letterSpacing: 0.3,
        },
        terms: {
          fontSize: 12,
          color: colors.textMuted ?? colors.textSecondary,
          textAlign: 'center',
          marginTop: 14,
          lineHeight: 18,
          paddingHorizontal: spacing.md,
        },
      }),
    [colors, theme, isDark, cardBg, cardBorder, selectedBorder]
  );

  const renderPlanCard = (plan: (typeof plans)[0], index: number) => {
    const isSelected = selectedPlan === index;
    const priceParts = plan.price.split(/(\d[\d,]*)/);
    // priceParts example: ['₹', '249', ''] or ['₹', '1,999', '']

    return (
      <TouchableOpacity
        key={index}
        activeOpacity={0.8}
        style={[styles.planCard, isSelected && styles.planCardSelected]}
        onPress={() => setSelectedPlan(index)}
      >
        {/* Popular gradient strip */}
        {plan.popular && (
          <LinearGradient
            colors={[colors.primary, '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.popularStrip}
          >
            <Text style={styles.popularStripText}>MOST POPULAR</Text>
          </LinearGradient>
        )}

        <View style={plan.popular ? styles.planContentWithBanner : undefined}>
          {/* Top row: name + savings + radio */}
          <View style={styles.planTopRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={styles.planName}>{plan.name}</Text>
              {plan.savings && (
                <View style={styles.savingsPill}>
                  <Text style={styles.savingsText}>{plan.savings}</Text>
                </View>
              )}
            </View>
            <View
              style={[
                styles.radioOuter,
                isSelected && styles.radioOuterSelected,
              ]}
            >
              {isSelected && <View style={styles.radioInner} />}
            </View>
          </View>

          <Text style={styles.planDescription}>{plan.description}</Text>

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.priceAmount}>{plan.price}</Text>
            <Text style={styles.pricePeriod}>{plan.period}</Text>
          </View>

          {plan.monthlyEquiv && (
            <Text style={styles.monthlyEquiv}>
              That's just {plan.monthlyEquiv}
            </Text>
          )}

          <View style={styles.divider} />

          {/* Features */}
          <View style={styles.featuresList}>
            {plan.features.map((feature, idx) => (
              <View key={idx} style={styles.featureRow}>
                <View style={styles.featureCheckCircle}>
                  <Ionicons name="checkmark" size={14} color={checkColor} />
                </View>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View
          style={[
            styles.heroSection,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.crownContainer}>
            <Text style={styles.crownIcon}>👑</Text>
          </View>
          <Text style={styles.title}>Go Premium</Text>
          <Text style={styles.subtitle}>
            Unlock unlimited access to all books, audiobooks & exclusive content
          </Text>

          {user?.is_premium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="checkmark-circle" size={18} color={ACCENT_DARK} />
              <Text style={styles.premiumBadgeText}>Premium Member</Text>
            </View>
          )}
        </Animated.View>

        {/* Plan Cards */}
        <View style={styles.plansSection}>
          {plans.map((plan, index) => renderPlanCard(plan, index))}
        </View>

        {/* CTA */}
        <View style={styles.ctaSection}>
          <TouchableOpacity activeOpacity={0.85} onPress={handleSubscribe}>
            <LinearGradient
              colors={[colors.primary, '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaButtonText}>
                Subscribe for {plans[selectedPlan].price}
                {plans[selectedPlan].period}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.terms}>
            By subscribing, you agree to our Terms of Service and Privacy Policy.
            {'\n'}Cancel anytime. No questions asked.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}