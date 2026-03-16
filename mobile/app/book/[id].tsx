import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { contentService } from '../../src/services/content.service';
import { Content, AccessType } from '../../src/types';
import { useAppSelector } from '../../src/hooks/useAppSelector';
import { useAppDispatch } from '../../src/hooks/useAppDispatch';
import { addToWishlist, removeFromWishlist, addToLibrary, removeFromLibrary } from '../../src/store/slices/contentSlice';
import { LoadingScreen } from '../../src/components/layout/LoadingScreen';
import { Button } from '../../src/components/buttons/Button';
import { useTheme } from '../../src/theme/ThemeContext';

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const { user } = useAppSelector((state) => state.auth);
  const wishlist = useAppSelector((state) => state.content.wishlist);
  const library = useAppSelector((state) => state.content.library);
  const [book, setBook] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);

  const inWishlist = wishlist.some((item) => item.id === id);
  const inLibrary = library.some((item) => item.id === id);

  useEffect(() => { loadBook(); }, [id]);

  const loadBook = async () => {
    try {
      const data = await contentService.getContentById(id);
      setBook(data);
    } catch {
      Alert.alert('Error', 'Failed to load book details');
    } finally {
      setLoading(false);
    }
  };

  const handleRead = () => {
    if (!book) return;
    if (book.access_type === AccessType.COINS && book.coin_price > (user?.coin_balance || 0)) {
      Alert.alert('Insufficient Coins', `You need ${book.coin_price} coins to unlock this book.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Buy Coins', onPress: () => router.push('/wallet') },
      ]);
      return;
    }
    if (book.access_type === AccessType.PREMIUM && !user?.is_premium) {
      Alert.alert('Premium Required', 'This book is available only for premium members.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Go Premium', onPress: () => router.push('/subscription') },
      ]);
      return;
    }
    if (book.chapters && book.chapters.length > 0) {
      router.push({ pathname: '/reader/[id]', params: { id: book.id, chapterId: book.chapters[0].id } });
    } else {
      Alert.alert('Coming Soon', 'This book has no chapters yet.');
    }
  };

  const handleAddToLibrary = () => {
    if (!book) return;
    if (inLibrary) dispatch(removeFromLibrary(book.id));
    else dispatch(addToLibrary(book));
  };

  const handleWishlist = () => {
    if (!book) return;
    if (inWishlist) dispatch(removeFromWishlist(book.id));
    else dispatch(addToWishlist(book));
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
    actions: { flexDirection: 'row', paddingHorizontal: spacing.md, gap: spacing.md, marginBottom: spacing.lg },
    readButton: { flex: 1 },
    iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    section: { paddingHorizontal: spacing.md, marginBottom: spacing.lg },
    sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
    description: { ...typography.body, color: colors.textSecondary, lineHeight: 24 },
    detail: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
    detailLabel: { ...typography.body, color: colors.textSecondary },
    detailValue: { ...typography.body, color: colors.text },
    chapterItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    chapterOrder: { ...typography.body, color: colors.primary, fontWeight: 'bold' as const, width: 40 },
    chapterTitle: { ...typography.body, color: colors.text, flex: 1 },
    errorContainer: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
    errorText: { ...typography.h3, color: colors.textSecondary },
  }), [colors]);

  if (loading) return <LoadingScreen />;

  if (!book) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Book not found</Text>
      </View>
    );
  }

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
                  {book.access_type === AccessType.FREE ? 'FREE'
                    : book.access_type === AccessType.COINS ? `${book.coin_price} COINS`
                    : book.access_type === AccessType.PREMIUM ? 'PREMIUM'
                    : 'SUBSCRIPTION'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Button title="Read Now" onPress={handleRead} style={styles.readButton} />
          <TouchableOpacity style={styles.iconButton} onPress={handleAddToLibrary}>
            <Ionicons name={inLibrary ? 'checkmark-circle' : 'add-circle-outline'} size={32} color={colors.primary} />
          </TouchableOpacity>
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
            {book.chapters.map((chapter) => (
              <TouchableOpacity
                key={chapter.id}
                style={styles.chapterItem}
                onPress={() => router.push({ pathname: '/reader/[id]', params: { id: book.id, chapterId: chapter.id } })}
                activeOpacity={0.7}
              >
                <Text style={styles.chapterOrder}>{chapter.order}</Text>
                <Text style={styles.chapterTitle}>{chapter.title}</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
