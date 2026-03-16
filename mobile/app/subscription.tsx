import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '../src/theme/typography';
import { spacing } from '../src/theme/spacing';
import { useAppSelector } from '../src/hooks/useAppSelector';
import { Button } from '../src/components/buttons/Button';
import { useTheme } from '../src/theme/ThemeContext';

const plans = [
  {
    name: 'Monthly',
    price: '$9.99',
    period: '/month',
    features: [
      'Unlimited access to premium content',
      'Ad-free experience',
      'Download for offline',
      'Early access to new releases',
      'HD audio quality',
    ],
  },
  {
    name: 'Yearly',
    price: '$99.99',
    period: '/year',
    savings: 'Save 17%',
    popular: true,
    features: [
      'All Monthly features',
      'Save $20 per year',
      'Priority customer support',
      'Exclusive member events',
      'Gift subscriptions',
    ],
  },
];

export default function SubscriptionScreen() {
  const { user } = useAppSelector((state) => state.auth);
  const { colors } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState(1);

  const handleSubscribe = () => {
    Alert.alert(
      'Subscribe',
      `Subscribe to ${plans[selectedPlan].name} plan for ${plans[selectedPlan].price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Subscribe', onPress: () => Alert.alert('Success', 'Subscription activated! (Mock)') },
      ]
    );
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { alignItems: 'center', paddingVertical: spacing.xl },
    icon: { fontSize: 64, marginBottom: spacing.md },
    title: { ...typography.h1, color: colors.text, marginBottom: spacing.sm },
    subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.xl },
    currentPlan: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg, gap: spacing.sm },
    currentPlanText: { ...typography.body, color: colors.success, fontWeight: '600' as const },
    plansContainer: { paddingHorizontal: spacing.md, gap: spacing.md },
    planCard: { padding: spacing.lg, backgroundColor: colors.backgroundCard, borderRadius: 16, borderWidth: 2, borderColor: colors.border },
    selectedPlan: { borderColor: colors.primary },
    popularPlan: { borderColor: colors.primary },
    popularBadge: { position: 'absolute', top: -12, left: spacing.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 8 },
    popularText: { ...typography.caption, color: '#fff', fontWeight: 'bold' as const },
    planHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
    planName: { ...typography.h2, color: colors.text },
    savingsBadge: { backgroundColor: colors.success, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 6 },
    savingsText: { ...typography.caption, color: '#fff', fontWeight: 'bold' as const },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: spacing.lg },
    price: { fontSize: 36, fontWeight: 'bold' as const, color: colors.text },
    period: { ...typography.body, color: colors.textSecondary, marginLeft: spacing.sm },
    features: { gap: spacing.md },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    featureText: { ...typography.body, color: colors.textSecondary, flex: 1 },
    buttonContainer: { padding: spacing.md, marginTop: spacing.lg },
    terms: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.icon}>⭐</Text>
          <Text style={styles.title}>Go Premium</Text>
          <Text style={styles.subtitle}>Unlock unlimited access to premium content</Text>
        </View>

        {user?.is_premium && (
          <View style={styles.currentPlan}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <Text style={styles.currentPlanText}>You're a Premium Member</Text>
          </View>
        )}

        <View style={styles.plansContainer}>
          {plans.map((plan, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.planCard, selectedPlan === index && styles.selectedPlan, plan.popular && styles.popularPlan]}
              onPress={() => setSelectedPlan(index)}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>MOST POPULAR</Text>
                </View>
              )}
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                {plan.savings && (
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText}>{plan.savings}</Text>
                  </View>
                )}
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.price}>{plan.price}</Text>
                <Text style={styles.period}>{plan.period}</Text>
              </View>
              <View style={styles.features}>
                {plan.features.map((feature, idx) => (
                  <View key={idx} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title={`Subscribe for ${plans[selectedPlan].price}${plans[selectedPlan].period}`}
            onPress={handleSubscribe}
            fullWidth
          />
          <Text style={styles.terms}>
            By subscribing, you agree to our Terms of Service and Privacy Policy. Cancel anytime.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
