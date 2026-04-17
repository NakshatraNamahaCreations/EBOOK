import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { contentService } from '../../src/services/content.service';
import { paymentService } from '../../src/services/payment.service';
import { Content, AccessType } from '../../src/types';
import { useAppSelector } from '../../src/hooks/useAppSelector';
import { useAppDispatch } from '../../src/hooks/useAppDispatch';
import { addToWishlist, removeFromWishlist } from '../../src/store/slices/contentSlice';
import { LoadingScreen } from '../../src/components/layout/LoadingScreen';
import { Button } from '../../src/components/buttons/Button';
import { useTheme } from '../../src/theme/ThemeContext';
import { ReviewSection } from '../../src/components/ReviewSection';
import { useAudioPlayer } from '../../src/context/AudioPlayerContext';

let WebView: any = null;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

interface RazorpayOrder {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  book_title: string;
}



export default function AudiobookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const { user } = useAppSelector((state) => state.auth);
  const wishlist = useAppSelector((state) => state.content.wishlist);

  const { trackInfo, isPlaying: ctxIsPlaying } = useAudioPlayer();

  const [audiobook, setAudiobook] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPurchased, setIsPurchased] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [razorpayOrder, setRazorpayOrder] = useState<RazorpayOrder | null>(null);

  // Coupon
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number; finalAmount: number; description: string } | null>(null);

  const inWishlist = wishlist.some((item) => item.id === id);

  useEffect(() => { loadAudiobook(); }, [id]);

  const loadAudiobook = async () => {
    try {
      const data = await contentService.getAudiobookById(id);
      setAudiobook(data);

      if (user && data.access_type === AccessType.PAID) {
        try {
          const status = await paymentService.getPurchaseStatus(id, 'audiobook');
          setIsPurchased(status.purchased ?? false);
        } catch (e) {
          console.error('Could not fetch purchase status', e);
        }
      } else if (data.access_type === AccessType.FREE) {
        setIsPurchased(true);
      }
    } catch {
      Alert.alert('Error', 'Failed to load audiobook details');
    } finally {
      setLoading(false);
    }
  };

  // ── Web Razorpay ────────────────────────────────────────────
  const openRazorpayWeb = (order: RazorpayOrder) => {
    return new Promise<void>((resolve, reject) => {
      const doOpen = () => {
        const options: any = {
          key: order.key_id,
          amount: order.amount,
          currency: order.currency,
          name: 'Salil Javeri',
          description: order.book_title,
          order_id: order.order_id,
          handler: async (response: any) => {
            setPurchaseLoading(true);
            try {
              await paymentService.verifyPayment(id, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              setIsPurchased(true);
              Alert.alert('Success', 'Payment successful! You can now listen to this audiobook.');
            } catch (err: any) {
              Alert.alert('Verification Failed', err?.message || 'Payment verification failed.');
            } finally {
              setPurchaseLoading(false);
            }
            resolve();
          },
          modal: { ondismiss: () => resolve() },
          prefill: { name: user?.name || '', contact: user?.mobile_number || '' },
          theme: { color: '#FF6B6B' },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', (r: any) => {
          Alert.alert('Payment Failed', r.error?.description || 'Payment failed.');
          resolve();
        });
        rzp.open();
      };

      const existing = document.getElementById('razorpay-checkout-js');
      if (existing) { doOpen(); return; }
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-js';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = doOpen;
      script.onerror = () => reject(new Error('Failed to load payment gateway'));
      document.body.appendChild(script);
    });
  };

  const handleApplyCoupon = async () => {
    if (!audiobook || !couponInput.trim()) return;
    const price = audiobook.price_inr ?? 0;
    setCouponLoading(true);
    try {
      const res = await paymentService.validateCoupon(couponInput.trim(), id, 'audiobook', price);
      const data = res.data || res;
      setAppliedCoupon({
        code: data.code,
        discountAmount: data.discountAmount,
        finalAmount: data.finalAmount,
        description: data.description || '',
      });
      setCouponInput('');
    } catch (err: any) {
      Alert.alert('Invalid Coupon', err?.message || 'This coupon is not valid');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!audiobook) return;
    setPurchaseLoading(true);
    try {
      const order = await paymentService.createBookOrder(id, 'audiobook', appliedCoupon?.code);
      if (order.already_purchased) {
        setIsPurchased(true);
        return;
      }
      const rzpOrder: RazorpayOrder = {
        order_id: order.order_id,
        amount: order.amount,
        currency: order.currency,
        key_id: order.key_id,
        book_title: order.book_title,
      };
      if (Platform.OS === 'web') {
        setPurchaseLoading(false);
        await openRazorpayWeb(rzpOrder);
      } else {
        setRazorpayOrder(rzpOrder);
        setShowRazorpay(true);
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Could not initiate payment. Please try again.');
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handleRazorpayMessage = async (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === 'PAYMENT_SUCCESS') {
        setShowRazorpay(false);
        setPurchaseLoading(true);
        try {
          await paymentService.verifyPayment(id, message.data);
          setIsPurchased(true);
          Alert.alert('Success', 'Payment successful! You can now listen to this audiobook.');
        } catch (err: any) {
          Alert.alert('Verification Failed', err?.message || 'Payment verification failed.');
        } finally {
          setPurchaseLoading(false);
        }
      } else if (message.type === 'PAYMENT_FAILED') {
        setShowRazorpay(false);
        if (message.error !== 'dismissed') {
          Alert.alert('Payment Failed', message.error || 'Payment was not completed.');
        }
      }
    } catch (e) {}
  };

  const getRazorpayHtml = (): string => {
    if (!razorpayOrder) return '';
    const keyId = razorpayOrder.key_id;
    const amount = razorpayOrder.amount.toString();
    const currency = razorpayOrder.currency;
    const bookTitle = razorpayOrder.book_title.replace(/"/g, '\\"');
    const orderId = razorpayOrder.order_id;
    const userName = (user?.name || '').replace(/"/g, '\\"');
    const userPhone = user?.mobile_number || '';

    return `<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="background:#000;margin:0;">
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script>
  var options = {
    key: "${keyId}", amount: "${amount}", currency: "${currency}",
    name: "Salil Javeri", description: "${bookTitle}", order_id: "${orderId}",
    handler: function(response) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PAYMENT_SUCCESS', data: { razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature } }));
    },
    modal: { ondismiss: function() { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PAYMENT_FAILED', error: 'dismissed' })); } },
    prefill: { name: "${userName}", contact: "${userPhone}" },
    theme: { color: "#FF6B6B" }
  };
  var rzp = new Razorpay(options);
  rzp.on('payment.failed', function(r) { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PAYMENT_FAILED', error: r.error.description })); });
  rzp.open();
</script>
</body>
</html>`;
  };

  const handleWishlist = async () => {
    if (!audiobook) return;
    if (inWishlist) {
      dispatch(removeFromWishlist(audiobook.id));
      try { await contentService.removeFromWishlist('', audiobook.id); } catch {}
    } else {
      dispatch(addToWishlist(audiobook));
      try { await contentService.addToWishlist('', audiobook.id, 'audiobook' as any); } catch {}
    }
  };

  const handlePlay = (chapterIndex = 0) => {
    if (!audiobook) return;
    router.push(`/player/${audiobook.id}?chapterIndex=${chapterIndex}`);
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { padding: spacing.md, flexDirection: 'row' },
    cover: { width: 120, height: 180, borderRadius: 12, backgroundColor: colors.backgroundCard },
    headerInfo: { flex: 1, marginLeft: spacing.md },
    title: { ...typography.h2, color: colors.text, marginBottom: spacing.sm },
    author: { ...typography.body, color: colors.textSecondary, marginBottom: 4 },
    narrator: { ...typography.bodySmall, color: colors.primary, marginBottom: spacing.md },
    meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    metaItem: { flexDirection: 'row', alignItems: 'center' },
    metaText: { ...typography.bodySmall, color: colors.textSecondary, marginLeft: 4 },
    ratingText: { ...typography.body, color: colors.text, marginLeft: 4 },
    accessBadge: { backgroundColor: colors.primary, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 6, marginTop: spacing.sm, alignSelf: 'flex-start' },
    accessText: { ...typography.caption, color: '#fff', fontWeight: 'bold' as const },
    actions: { flexDirection: 'row', paddingHorizontal: spacing.md, gap: spacing.md, marginBottom: spacing.lg, alignItems: 'center' },
    mainButton: { flex: 1 },
    buyButton: { flex: 1, backgroundColor: '#F59E0B', borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
    buyButtonText: { ...typography.body, color: '#fff', fontWeight: 'bold' as const, fontSize: 16 },
    iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    couponRow: { flexDirection: 'row' as const, gap: 8, width: '100%' },
    couponInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: '#d1d5db',
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.text,
      backgroundColor: colors.backgroundCard,
      letterSpacing: 1,
    },
    couponApplyBtn: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    couponApplyText: { color: '#fff', fontWeight: 'bold' as const, fontSize: 14 },
    couponApplied: {
      flexDirection: 'row' as const,
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#f0fdf4',
      borderWidth: 1,
      borderColor: '#bbf7d0',
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      width: '100%',
    },
    couponAppliedLeft: { flexDirection: 'row' as const, alignItems: 'center', gap: 6 },
    couponAppliedCode: { fontWeight: 'bold' as const, fontSize: 13, color: '#16a34a' },
    couponAppliedSaving: { fontSize: 13, color: '#16a34a' },
    priceSummary: { flexDirection: 'row' as const, alignItems: 'center', gap: 10, paddingHorizontal: 4, width: '100%' },
    priceOriginal: { fontSize: 15, color: '#9ca3af', textDecorationLine: 'line-through' as const },
    priceFinal: { fontSize: 18, fontWeight: 'bold' as const, color: colors.text },
    section: { paddingHorizontal: spacing.md, marginBottom: spacing.lg },
    sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
    description: { ...typography.body, color: colors.textSecondary, lineHeight: 24 },
    detail: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
    detailLabel: { ...typography.body, color: colors.textSecondary },
    detailValue: { ...typography.body, color: colors.text },
    chapterItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    chapterOrder: { ...typography.body, color: colors.primary, fontWeight: 'bold' as const, width: 40 },
    chapterInfo: { flex: 1 },
    chapterTitle: { ...typography.body, color: colors.text, marginBottom: 2 },
    chapterPlayBtn: { width: 40, alignItems: 'center', justifyContent: 'center' },
    chapterItemActive: { backgroundColor: colors.primary + '18', borderRadius: 10, paddingHorizontal: spacing.sm },
    chapterTitleActive: { color: colors.primary, fontWeight: '600' as const },
    nowPlayingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    nowPlayingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
    nowPlayingText: { ...typography.caption, color: colors.primary, fontWeight: '600' as const },
    pausedText: { ...typography.caption, color: colors.textMuted },
    errorContainer: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
    errorText: { ...typography.h3, color: colors.textSecondary },
    modalContainer: { flex: 1, backgroundColor: '#000' },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, backgroundColor: '#111' },
    modalTitle: { ...typography.body, color: '#fff', fontWeight: 'bold' as const },
    closeButton: { padding: spacing.sm },
    webview: { flex: 1 },
    loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  }), [colors]);

  if (loading) return <LoadingScreen />;

  if (!audiobook) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Audiobook not found</Text>
      </View>
    );
  }

  const isFreeOrPurchased = audiobook.access_type === AccessType.FREE || isPurchased;
  const isPaid = audiobook.access_type === AccessType.PAID && !isPurchased;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{
        title: 'Audiobook Details',
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { ...typography.h3, color: colors.text },
        headerShadowVisible: false,
      }} />
      <ScrollView>
        <View style={styles.header}>
          <Image
            source={audiobook.cover_image ? { uri: audiobook.cover_image } : require('../../assets/images/icon.png')}
            style={styles.cover}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.title}>{audiobook.title}</Text>
            <Text style={styles.author}>by {audiobook.author_name}</Text>
            {audiobook.narrator_name && (
              <Text style={styles.narrator}>🎧 {audiobook.narrator_name}</Text>
            )}
            <View style={styles.meta}>
              <View style={styles.metaItem}>
                <Ionicons name="star" size={16} color={colors.accent} />
                <Text style={styles.ratingText}>{(audiobook.rating ?? 0).toFixed(1)}</Text>
              </View>
            </View>
            <View style={styles.accessBadge}>
              <Text style={styles.accessText}>
                {audiobook.access_type === AccessType.FREE
                  ? 'FREE'
                  : isPurchased
                  ? 'PURCHASED'
                  : `₹${audiobook.price_inr ?? 0}`}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.actions, isFreeOrPurchased ? { flexDirection: 'row', alignItems: 'center' } : { flexDirection: 'column' }]}>
          {isFreeOrPurchased ? (
            <>
              <Button title="Play Now" onPress={() => handlePlay(0)} style={styles.mainButton} />
              <TouchableOpacity style={styles.iconButton} onPress={handleWishlist}>
                <Ionicons name={inWishlist ? 'heart' : 'heart-outline'} size={32} color={colors.primary} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Coupon input */}
              {!appliedCoupon ? (
                <View style={styles.couponRow}>
                  <TextInput
                    style={styles.couponInput}
                    placeholder="Enter coupon code"
                    placeholderTextColor="#999"
                    value={couponInput}
                    onChangeText={t => setCouponInput(t)}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={handleApplyCoupon}
                  />
                  <TouchableOpacity
                    style={styles.couponApplyBtn}
                    onPress={handleApplyCoupon}
                    disabled={couponLoading || !couponInput.trim()}
                    activeOpacity={0.8}
                  >
                    {couponLoading
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={styles.couponApplyText}>Apply</Text>}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.couponApplied}>
                  <View style={styles.couponAppliedLeft}>
                    <Ionicons name="pricetag" size={14} color="#16a34a" />
                    <Text style={styles.couponAppliedCode}>{appliedCoupon.code}</Text>
                    <Text style={styles.couponAppliedSaving}>-₹{appliedCoupon.discountAmount}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setAppliedCoupon(null)}>
                    <Ionicons name="close-circle" size={18} color="#999" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Price summary */}
              {appliedCoupon && (
                <View style={styles.priceSummary}>
                  <Text style={styles.priceOriginal}>₹{audiobook.price_inr ?? 0}</Text>
                  <Text style={styles.priceFinal}>₹{appliedCoupon.finalAmount}</Text>
                </View>
              )}

              {/* Buy button row with wishlist */}
              <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center', width: '100%' }}>
                <TouchableOpacity
                  style={[styles.buyButton, { flex: 1 }]}
                  onPress={handleBuy}
                  disabled={purchaseLoading}
                  activeOpacity={0.85}
                >
                  {purchaseLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buyButtonText}>
                      Buy ₹{appliedCoupon ? appliedCoupon.finalAmount : (audiobook.price_inr ?? 0)}
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }} onPress={handleWishlist}>
                  <Ionicons name={inWishlist ? 'heart' : 'heart-outline'} size={32} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{audiobook.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>Language</Text>
            <Text style={styles.detailValue}>{audiobook.language}</Text>
          </View>
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>Chapters</Text>
            <Text style={styles.detailValue}>{audiobook.chapters.length}</Text>
          </View>
        </View>

        {audiobook.chapters.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chapters</Text>
            {audiobook.chapters.map((chapter, index) => {
              const isActive = trackInfo?.bookId === audiobook.id && trackInfo?.chapterIndex === index;
              const isThisPlaying = isActive && ctxIsPlaying;
              const isThisPaused = isActive && !ctxIsPlaying;

              return (
                <TouchableOpacity
                  key={chapter.id}
                  style={[styles.chapterItem, isActive && styles.chapterItemActive]}
                  onPress={() => {
                    if (isPaid) {
                      Alert.alert('Purchase Required', `Buy this audiobook for ₹${audiobook.price_inr ?? 0} to listen.`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: `Buy ₹${audiobook.price_inr ?? 0}`, onPress: handleBuy },
                      ]);
                    } else {
                      handlePlay(index);
                    }
                  }}
                  activeOpacity={0.7}
                  disabled={purchaseLoading}
                >
                  <Text style={[styles.chapterOrder, isActive && { color: colors.primary }]}>
                    {chapter.order}
                  </Text>
                  <View style={styles.chapterInfo}>
                    <Text style={[styles.chapterTitle, isActive && styles.chapterTitleActive]}>
                      {chapter.title}
                    </Text>
                    {isThisPlaying && (
                      <View style={styles.nowPlayingBadge}>
                        <View style={styles.nowPlayingDot} />
                        <Text style={styles.nowPlayingText}>Now Playing</Text>
                      </View>
                    )}
                    {isThisPaused && (
                      <Text style={styles.pausedText}>⏸ Paused</Text>
                    )}
                  </View>
                  <View style={styles.chapterPlayBtn}>
                    {isFreeOrPurchased ? (
                      isThisPlaying ? (
                        <Ionicons name="pause-circle" size={32} color={colors.primary} />
                      ) : isThisPaused ? (
                        <Ionicons name="play-circle" size={32} color={colors.textSecondary} />
                      ) : (
                        <Ionicons name="play-circle" size={32} color={colors.primary} />
                      )
                    ) : (
                      <Ionicons name="lock-closed" size={20} color={colors.textMuted} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {isPurchased && (
          <View style={styles.section}>
            <ReviewSection bookId={id} />
          </View>
        )}
      </ScrollView>

      {/* Razorpay WebView Modal — native only */}
      {Platform.OS !== 'web' && (
        <Modal visible={showRazorpay} animationType="slide" onRequestClose={() => setShowRazorpay(false)}>
          <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Complete Payment</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowRazorpay(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            {razorpayOrder && WebView && (
              <WebView
                style={styles.webview}
                source={{ html: getRazorpayHtml() }}
                onMessage={handleRazorpayMessage}
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState
                renderLoading={() => (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#FF6B6B" />
                  </View>
                )}
              />
            )}
          </SafeAreaView>
        </Modal>
      )}

      {purchaseLoading && !showRazorpay && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </SafeAreaView>
  );
}
