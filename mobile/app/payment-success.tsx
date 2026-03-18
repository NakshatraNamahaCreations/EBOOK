import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

const ICON_SIZE = 96;

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { bookTitle, amount, bookId, paymentId } = useLocalSearchParams<{
    bookTitle: string;
    amount: string;
    bookId: string;
    paymentId?: string;
  }>();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const ring1Anim = useRef(new Animated.Value(0)).current;
  const ring2Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 1400, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0,    useNativeDriver: true }),
        ])
      );

    Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }).start();
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    pulse(ring1Anim, 0).start();
    pulse(ring2Anim, 700).start();
  }, []);

  const ring1Style = {
    opacity:   ring1Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.45, 0.15, 0] }),
    transform: [{ scale: ring1Anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.0] }) }],
  };
  const ring2Style = {
    opacity:   ring2Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 0.1, 0] }),
    transform: [{ scale: ring2Anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] }) }],
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050811" />
      <LinearGradient colors={['#060D1A', '#050811', '#071220']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Icon */}
          <View style={styles.iconWrap}>
            <Animated.View style={[styles.ring, ring2Style]} />
            <Animated.View style={[styles.ring, ring1Style]} />
            <Animated.View style={[styles.iconCircleWrap, { transform: [{ scale: scaleAnim }] }]}>
              <LinearGradient
                colors={['#22C55E', '#16A34A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconCircle}
              >
                <Ionicons name="checkmark" size={46} color="#FFFFFF" />
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Text */}
          <Animated.View style={[styles.textSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.label}>Payment Successful</Text>
            <Text style={styles.title}>You're all set!</Text>
            <Text style={styles.subtitle}>
              Your purchase is confirmed and ready to enjoy right now.
            </Text>
          </Animated.View>

          {/* Receipt */}
          <Animated.View style={[styles.receiptCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptKey}>Book</Text>
              <Text style={styles.receiptValue} numberOfLines={1}>
                {bookTitle || 'Book Purchase'}
              </Text>
            </View>

            <View style={styles.receiptDivider} />

            <View style={styles.receiptRow}>
              <Text style={styles.receiptKey}>Amount Paid</Text>
              <View style={styles.amountPill}>
                <Text style={styles.amountPillText}>₹{amount || '0'}</Text>
              </View>
            </View>

            {paymentId ? (
              <>
                <View style={styles.receiptDivider} />
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptKey}>Transaction ID</Text>
                  <Text style={styles.receiptValueMuted} numberOfLines={1}>
                    {paymentId}
                  </Text>
                </View>
              </>
            ) : null}

            <View style={styles.receiptDivider} />

            <View style={styles.receiptRow}>
              <Text style={styles.receiptKey}>Status</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Completed</Text>
              </View>
            </View>
          </Animated.View>

          {/* Buttons */}
          <Animated.View style={[styles.buttonsSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <TouchableOpacity activeOpacity={0.85} onPress={() => router.replace(`/book/${bookId}`)} style={styles.primaryBtnWrap}>
              <LinearGradient
                colors={['#22C55E', '#16A34A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryBtn}
              >
                <Ionicons name="book-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>Start Reading</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7} onPress={() => router.replace('/(tabs)/home')} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Back to Home</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#050811' },
  safeArea:{ flex: 1 },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },

  /* Icon */
  iconWrap: {
    width: ICON_SIZE * 2.6,
    height: ICON_SIZE * 2.6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  ring: {
    position: 'absolute',
    width: ICON_SIZE + 16,
    height: ICON_SIZE + 16,
    borderRadius: (ICON_SIZE + 16) / 2,
    borderWidth: 1.5,
    borderColor: '#22C55E',
  },
  iconCircleWrap: {
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 14,
  },
  iconCircle: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Text */
  textSection: { alignItems: 'center', marginBottom: 24 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#22C55E',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 270,
  },

  /* Receipt */
  receiptCard: {
    width: '100%',
    backgroundColor: '#0D1520',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 18,
    paddingVertical: 4,
    marginBottom: 20,
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
  receiptKey:       { fontSize: 13, color: '#64748B', fontWeight: '500' },
  receiptValue:     { fontSize: 13, color: '#E2E8F0', fontWeight: '700', maxWidth: 180, textAlign: 'right' },
  receiptValueMuted:{ fontSize: 12, color: '#64748B', fontWeight: '500', maxWidth: 160, textAlign: 'right' },
  receiptDivider:   { height: 1, backgroundColor: '#1A2535' },
  amountPill: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  amountPillText:   { fontSize: 14, fontWeight: '800', color: '#22C55E' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34,197,94,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22C55E' },
  statusText: { fontSize: 12, fontWeight: '700', color: '#22C55E' },

  /* Buttons */
  buttonsSection: { width: '100%', gap: 10 },
  primaryBtnWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.2 },
  secondaryBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    backgroundColor: '#0D1520',
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
});
