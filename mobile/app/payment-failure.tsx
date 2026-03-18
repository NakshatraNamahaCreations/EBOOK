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

export default function PaymentFailureScreen() {
  const router = useRouter();
  const { bookTitle, amount, bookId, errorMessage } = useLocalSearchParams<{
    bookTitle: string;
    amount: string;
    bookId: string;
    errorMessage?: string;
  }>();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
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

    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 9,  duration: 55, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -9, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6,  duration: 55, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0,  duration: 55, useNativeDriver: true }),
      ]),
    ]).start();

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
      <LinearGradient colors={['#0D0606', '#050811', '#120707']} style={StyleSheet.absoluteFill} />

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
            <Animated.View
              style={[
                styles.iconCircleWrap,
                { transform: [{ scale: scaleAnim }, { translateX: shakeAnim }] },
              ]}
            >
              <LinearGradient
                colors={['#EF4444', '#B91C1C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconCircle}
              >
                <Ionicons name="close" size={46} color="#FFFFFF" />
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Text */}
          <Animated.View style={[styles.textSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.label}>Payment Failed</Text>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>
              {errorMessage || 'Your payment could not be processed. No money has been deducted.'}
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
              <Text style={styles.receiptKey}>Amount</Text>
              <View style={styles.amountPill}>
                <Text style={styles.amountPillText}>₹{amount || '0'}</Text>
              </View>
            </View>

            <View style={styles.receiptDivider} />

            <View style={styles.receiptRow}>
              <Text style={styles.receiptKey}>Status</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Failed</Text>
              </View>
            </View>
          </Animated.View>

          {/* Tip */}
          <Animated.View style={[styles.tipBox, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Ionicons name="information-circle-outline" size={17} color="#F59E0B" style={{ marginRight: 8, marginTop: 1 }} />
            <Text style={styles.tipText}>
              If money was deducted, it will be automatically refunded within 5–7 business days.
            </Text>
          </Animated.View>

          {/* Buttons */}
          <Animated.View style={[styles.buttonsSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <TouchableOpacity activeOpacity={0.85} onPress={() => router.replace(`/book/${bookId}`)} style={styles.primaryBtnWrap}>
              <LinearGradient
                colors={['#EF4444', '#B91C1C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryBtn}
              >
                <Ionicons name="refresh-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>Try Again</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.rowBtns}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.replace('/(tabs)/home')}
                style={[styles.outlineBtn, { flex: 1, marginRight: 8 }]}
              >
                <Text style={styles.outlineBtnText}>Home</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push('/profile/help')}
                style={[styles.outlineBtn, { flex: 1 }]}
              >
                <Ionicons name="headset-outline" size={15} color="#64748B" style={{ marginRight: 4 }} />
                <Text style={styles.outlineBtnText}>Support</Text>
              </TouchableOpacity>
            </View>
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
    borderColor: '#EF4444',
  },
  iconCircleWrap: {
    shadowColor: '#EF4444',
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
    color: '#EF4444',
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
    maxWidth: 290,
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
    marginBottom: 14,
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
  receiptKey:  { fontSize: 13, color: '#64748B', fontWeight: '500' },
  receiptValue:{ fontSize: 13, color: '#E2E8F0', fontWeight: '700', maxWidth: 180, textAlign: 'right' },
  receiptDivider: { height: 1, backgroundColor: '#1A2535' },
  amountPill: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  amountPillText: { fontSize: 14, fontWeight: '800', color: '#EF4444' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239,68,68,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: '#EF4444' },
  statusText: { fontSize: 12, fontWeight: '700', color: '#EF4444' },

  /* Tip */
  tipBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.18)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 20,
  },
  tipText: { flex: 1, fontSize: 12, color: '#D97706', lineHeight: 18 },

  /* Buttons */
  buttonsSection: { width: '100%', gap: 10 },
  primaryBtnWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#EF4444',
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
  rowBtns: { flexDirection: 'row' },
  outlineBtn: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    backgroundColor: '#0D1520',
  },
  outlineBtnText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
});
