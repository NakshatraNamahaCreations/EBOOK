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
} from 'react-native';
import { Platform } from 'react-native';
// WebView is only available on native — conditionally imported below
let WebView: any = null;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { contentService } from '../../src/services/content.service';
import { walletService } from '../../src/services/wallet.service';
import { paymentService } from '../../src/services/payment.service';
import { Content, AccessType, Chapter } from '../../src/types';
import { useAppSelector } from '../../src/hooks/useAppSelector';
import { useAppDispatch } from '../../src/hooks/useAppDispatch';
import { addToWishlist, removeFromWishlist } from '../../src/store/slices/contentSlice';
import { updateCoinBalance } from '../../src/store/slices/authSlice';
import { LoadingScreen } from '../../src/components/layout/LoadingScreen';
import { Button } from '../../src/components/buttons/Button';
import { useTheme } from '../../src/theme/ThemeContext';
import { ReviewSection } from '../../src/components/ReviewSection';

interface RazorpayOrder {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  book_title: string;
}

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const { user } = useAppSelector((state) => state.auth);
  const wishlist = useAppSelector((state) => state.content.wishlist);

  const [book, setBook] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [razorpayOrder, setRazorpayOrder] = useState<RazorpayOrder | null>(null);

  const inWishlist = wishlist.some((item) => item.id === id);

  useEffect(() => { loadBook(); }, [id]);

  const loadBook = async () => {
    try {
      const data = await contentService.getContentById(id);

      // Fetch chapter unlock statuses if logged in
      if (user) {
        try {
          const statusRes = await contentService.getChapterStatus(id);
          if (statusRes && Array.isArray(statusRes.data)) {
            data.chapters = statusRes.data;
          }
        } catch (e) {
          console.error('Could not fetch chapter statuses', e);
        }

        // Fetch purchase status for paid books
        try {
          const status = await paymentService.getPurchaseStatus(id);
          setIsPurchased(status.purchased ?? false);
        } catch (e) {
          console.error('Could not fetch purchase status', e);
        }
      }

      setBook(data);
    } catch {
      Alert.alert('Error', 'Failed to load book details');
    } finally {
      setLoading(false);
    }
  };

  const handleRead = () => {
    if (!book) return;
    if (book.chapters && book.chapters.length > 0) {
      handleChapterPress(book.chapters[0], 0);
    } else {
      Alert.alert('Coming Soon', 'This book has no chapters yet.');
    }
  };

  // ── Web: load Razorpay checkout.js and open popup ─────────────
  const openRazorpayWeb = (order: RazorpayOrder) => {
    return new Promise<void>((resolve, reject) => {
      // Load script if not already loaded
      const existing = document.getElementById('razorpay-checkout-js');
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
              router.replace({
                pathname: '/payment-success',
                params: {
                  bookTitle: order.book_title,
                  amount: String(Math.round(order.amount / 100)),
                  bookId: id,
                  paymentId: response.razorpay_payment_id,
                },
              });
            } catch (err: any) {
              router.replace({
                pathname: '/payment-failure',
                params: {
                  bookTitle: order.book_title,
                  amount: String(Math.round(order.amount / 100)),
                  bookId: id,
                  errorMessage: err?.message || 'Payment verification failed.',
                },
              });
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
          router.replace({
            pathname: '/payment-failure',
            params: {
              bookTitle: order.book_title,
              amount: String(Math.round(order.amount / 100)),
              bookId: id,
              errorMessage: r.error?.description || 'Payment failed.',
            },
          });
          resolve();
        });
        rzp.open();
      };

      if (existing) {
        doOpen();
      } else {
        const script = document.createElement('script');
        script.id = 'razorpay-checkout-js';
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = doOpen;
        script.onerror = () => reject(new Error('Failed to load payment gateway'));
        document.body.appendChild(script);
      }
    });
  };

  const handleBuy = async () => {
    if (!book) return;
    setPurchaseLoading(true);
    try {
      const order = await paymentService.createBookOrder(id);
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
          router.replace({
            pathname: '/payment-success',
            params: {
              bookTitle: razorpayOrder?.book_title || '',
              amount: String(Math.round((razorpayOrder?.amount || 0) / 100)),
              bookId: id,
              paymentId: message.data?.razorpay_payment_id || '',
            },
          });
        } catch (err: any) {
          router.replace({
            pathname: '/payment-failure',
            params: {
              bookTitle: razorpayOrder?.book_title || '',
              amount: String(Math.round((razorpayOrder?.amount || 0) / 100)),
              bookId: id,
              errorMessage: err?.message || 'Payment verification failed. Please contact support.',
            },
          });
        } finally {
          setPurchaseLoading(false);
        }
      } else if (message.type === 'PAYMENT_FAILED') {
        setShowRazorpay(false);
        if (message.error !== 'dismissed') {
          router.replace({
            pathname: '/payment-failure',
            params: {
              bookTitle: razorpayOrder?.book_title || '',
              amount: String(Math.round((razorpayOrder?.amount || 0) / 100)),
              bookId: id,
              errorMessage: message.error || 'Payment was not completed.',
            },
          });
        }
      }
    } catch (e) {
      // Non-JSON message from WebView — ignore
    }
  };

  const handleChapterPress = (chapter: Chapter, index: number = 0) => {
    if (!book) return;

    // Audiobook — tap chapter = play that track
    if (book.book_content_type === 'audiobook') {
      if (isPurchased || book.access_type === AccessType.FREE) {
        router.push(`/player/${book.id}?chapterIndex=${index}`);
      } else {
        Alert.alert(
          'Purchase Required',
          `Buy this audiobook for ₹${book.price_inr ?? 0} to listen.`,
          [{ text: 'Cancel', style: 'cancel' }, { text: `Buy ₹${book.price_inr ?? 0}`, onPress: handleBuy }]
        );
      }
      return;
    }

    // Purchased book or free book — all chapters open directly
    if (isPurchased || book.access_type === AccessType.FREE) {
      router.push({ pathname: '/reader/[id]', params: { id: book.id, chapterId: chapter.id } });
      return;
    }

    // Paid book not yet purchased — prompt buy
    if (book.access_type === AccessType.PAID) {
      Alert.alert(
        'Purchase Required',
        `Buy this book for ₹${book.price_inr ?? 0} to read all chapters.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: `Buy ₹${book.price_inr ?? 0}`, onPress: handleBuy },
        ]
      );
      return;
    }

    // Coin-based chapter unlock (for non-book content types)
    if (chapter.is_free || chapter.is_unlocked) {
      router.push({ pathname: '/reader/[id]', params: { id: book.id, chapterId: chapter.id } });
    } else {
      showUnlockPrompt(chapter);
    }
  };

  const showUnlockPrompt = (chapter: Chapter) => {
    Alert.alert(
      'Chapter Locked',
      `This chapter costs ${chapter.coin_cost} coins to unlock. You have ${user?.coin_balance || 0} coins.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Unlock with Coins', onPress: () => unlockChapter(chapter) },
      ]
    );
  };

  const unlockChapter = async (chapter: Chapter) => {
    if (!user || !book) return;
    if ((user.coin_balance || 0) < (chapter.coin_cost || 0)) {
      Alert.alert('Insufficient Coins', 'You do not have enough coins to unlock this chapter.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Buy Coins', onPress: () => router.push('/wallet') },
      ]);
      return;
    }

    setIsProcessing(true);
    try {
      const result = await walletService.unlockContent('chapter', chapter.id, chapter.coin_cost || 0);
      const newBalance = result?.data?.wallet?.availableCoins ?? (user.coin_balance - (chapter.coin_cost || 0));
      dispatch(updateCoinBalance(newBalance));
      setBook({
        ...book,
        chapters: book.chapters.map((ch) =>
          ch.id === chapter.id ? { ...ch, is_unlocked: true } : ch
        ),
      });
      router.push({ pathname: '/reader/[id]', params: { id: book.id, chapterId: chapter.id } });
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to unlock chapter');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWishlist = async () => {
    if (!book) return;
    const contentType = (book as any).book_content_type === 'audiobook' ? 'audiobook' : 'book';
    if (inWishlist) {
      dispatch(removeFromWishlist(book.id));
      try { await contentService.removeFromWishlist('', book.id); } catch {}
    } else {
      dispatch(addToWishlist(book));
      try { await contentService.addToWishlist('', book.id, contentType as any); } catch {}
    }
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
    key: "${keyId}",
    amount: "${amount}",
    currency: "${currency}",
    name: "Salil Javeri",
    description: "${bookTitle}",
    order_id: "${orderId}",
    handler: function(response) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'PAYMENT_SUCCESS',
        data: {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature
        }
      }));
    },
    modal: {
      ondismiss: function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PAYMENT_FAILED', error: 'dismissed' }));
      }
    },
    prefill: { name: "${userName}", contact: "${userPhone}" },
    theme: { color: "#FF6B6B" }
  };
  var rzp = new Razorpay(options);
  rzp.on('payment.failed', function(response) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PAYMENT_FAILED', error: response.error.description }));
  });
  rzp.open();
</script>
</body>
</html>`;
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    cover: { width: 120, height: 180, borderRadius: 12, backgroundColor: colors.backgroundCard },
    header: { padding: spacing.md, flexDirection: 'row' },
    headerInfo: { flex: 1, marginLeft: spacing.md },
    title: { ...typography.h2, color: colors.text, marginBottom: spacing.sm },
    author: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
    meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    rating: { flexDirection: 'row', alignItems: 'center' },
    ratingText: { ...typography.body, color: colors.text, marginLeft: 4 },
    reviewsText: { ...typography.bodySmall, color: colors.textSecondary, marginLeft: 4 },
    accessBadge: { backgroundColor: colors.primary, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 6 },
    accessText: { ...typography.caption, color: '#fff', fontWeight: 'bold' as const },
    actions: { flexDirection: 'row', paddingHorizontal: spacing.md, gap: spacing.md, marginBottom: spacing.lg, alignItems: 'center' },
    mainButton: { flex: 1 },
    iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    buyButton: {
      flex: 1,
      backgroundColor: '#F59E0B',
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buyButtonText: { ...typography.body, color: '#fff', fontWeight: 'bold' as const, fontSize: 16 },
    section: { paddingHorizontal: spacing.md, marginBottom: spacing.lg },
    sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
    description: { ...typography.body, color: colors.textSecondary, lineHeight: 24 },
    detail: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
    detailLabel: { ...typography.body, color: colors.textSecondary },
    detailValue: { ...typography.body, color: colors.text },
    chapterItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    chapterOrder: { ...typography.body, color: colors.primary, fontWeight: 'bold' as const, width: 40 },
    chapterTitleContainer: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    chapterTitle: { ...typography.body, color: colors.text, flex: 1 },
    chapterMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    chapterCost: { ...typography.caption, color: colors.accent, fontWeight: 'bold' as const },
    unlockedIcon: { marginRight: spacing.sm },
    unlockButton: { backgroundColor: colors.primary, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 6 },
    unlockButtonText: { ...typography.caption, color: '#fff', fontWeight: 'bold' as const },
    errorContainer: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
    errorText: { ...typography.h3, color: colors.textSecondary },
    modalContainer: { flex: 1, backgroundColor: '#000' },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      backgroundColor: '#111',
    },
    modalTitle: { ...typography.body, color: '#fff', fontWeight: 'bold' as const },
    closeButton: { padding: spacing.sm },
    webview: { flex: 1 },
    loadingOverlay: {
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      alignItems: 'center',
      justifyContent: 'center',
    },
  }), [colors]);

  if (loading) return <LoadingScreen />;

  if (!book) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Book not found</Text>
      </View>
    );
  }

  const isFreeOrPurchased = book.access_type === AccessType.FREE || isPurchased;
  const isPaid = book.access_type === AccessType.PAID && !isPurchased;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView>
        <View style={styles.header}>
          <Image
            source={book.cover_image ? { uri: book.cover_image } : require('../../assets/images/icon.png')}
            style={styles.cover}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.title}>{book.title}</Text>
            <Text style={styles.author}>by {book.author_name}</Text>
            <View style={styles.meta}>
              <View style={styles.rating}>
                <Ionicons name="star" size={16} color={colors.accent} />
                <Text style={styles.ratingText}>{(book.rating ?? 0).toFixed(1)}</Text>
                <Text style={styles.reviewsText}>({book.reviews_count})</Text>
              </View>
              <View style={styles.accessBadge}>
                <Text style={styles.accessText}>
                  {book.access_type === AccessType.FREE
                    ? 'FREE'
                    : book.access_type === AccessType.PAID
                    ? isPurchased
                      ? 'PURCHASED'
                      : `₹${book.price_inr ?? 0}`
                    : book.access_type === AccessType.COINS
                    ? `${book.coin_price} COINS`
                    : book.access_type === AccessType.PREMIUM
                    ? 'PREMIUM'
                    : 'SUBSCRIPTION'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          {isFreeOrPurchased ? (
            <Button
              title={book.book_content_type === 'audiobook' ? 'Play Now' : 'Read Now'}
              onPress={handleRead}
              style={styles.mainButton}
            />
          ) : (
            <TouchableOpacity
              style={styles.buyButton}
              onPress={handleBuy}
              disabled={purchaseLoading}
              activeOpacity={0.85}
            >
              {purchaseLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buyButtonText}>Buy ₹{book.price_inr ?? 0}</Text>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.iconButton} onPress={handleWishlist}>
            <Ionicons name={inWishlist ? 'heart' : 'heart-outline'} size={32} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{book.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>Language</Text>
            <Text style={styles.detailValue}>{book.language}</Text>
          </View>
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>Chapters</Text>
            <Text style={styles.detailValue}>{book.chapters.length}</Text>
          </View>
        </View>

        {book.chapters.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chapters</Text>
            {book.chapters.map((chapter, index) => (
              <TouchableOpacity
                key={chapter.id}
                style={styles.chapterItem}
                onPress={() => handleChapterPress(chapter, index)}
                activeOpacity={0.7}
                disabled={isProcessing || purchaseLoading}
              >
                <Text style={styles.chapterOrder}>{index+1}</Text>
                <View style={styles.chapterTitleContainer}>
                  <Text style={styles.chapterTitle} numberOfLines={1}>{chapter.title}</Text>
                </View>
                <View style={styles.chapterMeta}>
                  {book.book_content_type === 'audiobook' ? (
                    // Audiobook chapter — show play or lock
                    isFreeOrPurchased
                      ? <Ionicons name="play-circle" size={30} color={colors.primary} />
                      : <Ionicons name="lock-closed" size={18} color={colors.textSecondary} />
                  ) : (
                    // Ebook chapter
                    <>
                      {(isPurchased || chapter.is_unlocked === true || chapter.is_free) ? (
                        <Ionicons name="lock-open" size={16} color={colors.success} style={styles.unlockedIcon} />
                      ) : (
                        <>
                          {chapter.coin_cost && book.access_type !== AccessType.PAID ? (
                            <TouchableOpacity
                              style={styles.unlockButton}
                              onPress={(e) => { e.stopPropagation?.(); unlockChapter(chapter); }}
                              disabled={isProcessing}
                            >
                              <Text style={styles.unlockButtonText}>{chapter.coin_cost} Unlock</Text>
                            </TouchableOpacity>
                          ) : (
                            <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
                          )}
                        </>
                      )}
                      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </>
                  )}
                </View>
              </TouchableOpacity>
            ))}
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
        <Modal
          visible={showRazorpay}
          animationType="slide"
          onRequestClose={() => setShowRazorpay(false)}
        >
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

      {/* Overlay while verifying payment */}
      {purchaseLoading && !showRazorpay && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </SafeAreaView>
  );
}
