import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { ContentCard } from '../../src/components/cards/ContentCard';
import { contentService } from '../../src/services/content.service';
import { paymentService } from '../../src/services/payment.service';
import { Content, ContentType } from '../../src/types';
import { useTheme } from '../../src/theme/ThemeContext';
import { useAppSelector } from '../../src/hooks/useAppSelector';

type Tab = 'purchased' | 'wishlist';

const PAGE_SIZE = 20;

interface PaginatedState {
  items: Content[];
  page: number;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
}

const emptyState = (): PaginatedState => ({
  items: [],
  page: 1,
  hasMore: false,
  loading: false,
  loadingMore: false,
});

export default function LibraryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAppSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState<Tab>('purchased');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [purchasedItems, setPurchasedItems] = useState<Content[]>([]);
  const [purchasedLoading, setPurchasedLoading] = useState(false);
  const [wishlistState, setWishlistState] = useState<PaginatedState>(emptyState());

  const fetchPurchased = useCallback(async () => {
    if (!user?.id) return;
    setPurchasedLoading(true);
    try {
      const data = await paymentService.getMyPurchases();
      setPurchasedItems(Array.isArray(data) ? data : []);
    } catch {
      setPurchasedItems([]);
    } finally {
      setPurchasedLoading(false);
    }
  }, [user?.id]);

  const fetchWishlistPage = useCallback(
    async (page: number, append = false) => {
      if (!user?.id) return;
      setWishlistState((prev) => ({
        ...prev,
        loading: page === 1 && !append,
        loadingMore: page > 1,
      }));
      try {
        const result = await contentService.getWishlist(user.id, page, PAGE_SIZE);
        setWishlistState((prev) => ({
          items: append ? [...prev.items, ...result.data] : result.data,
          page,
          hasMore: result.pagination ? page < result.pagination.pages : false,
          loading: false,
          loadingMore: false,
        }));
      } catch {
        setWishlistState((prev) => ({ ...prev, loading: false, loadingMore: false }));
      }
    },
    [user?.id]
  );

  useEffect(() => {
    if (!user?.id) return;
    fetchPurchased();
    fetchWishlistPage(1);
  }, [user?.id]);

  const handleRefresh = async () => {
    if (!user?.id) return;
    setIsRefreshing(true);
    try {
      await Promise.all([fetchPurchased(), fetchWishlistPage(1)]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleContentPress = (content: Content) => {
    const isAudiobook =
      content.content_type === ContentType.AUDIOBOOK ||
      (content as any).book_content_type === 'audiobook';
    if (isAudiobook) router.push(`/audiobook/${content.id}`);
    else if (content.content_type === ContentType.BOOK) router.push(`/book/${content.id}`);
    else if (content.content_type === ContentType.PODCAST) router.push(`/podcast/${content.id}`);
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    tabsContainer: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingHorizontal: spacing.md,
    },
    tab: {
      flex: 1,
      paddingVertical: spacing.md,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    activeTab: { borderBottomColor: colors.primary },
    tabText: { ...typography.bodySmall, color: colors.textSecondary },
    activeTabText: { color: colors.primary, fontWeight: '600' as const },
    listContent: { padding: spacing.md, flexGrow: 1 },
    columnWrapper: { justifyContent: 'space-between' },
    gridItem: { marginBottom: spacing.lg },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl * 2 },
    emptyIcon: { fontSize: 64, marginBottom: spacing.lg },
    emptyText: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
    emptySubtext: { ...typography.body, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.xl },
    footerWrap: { alignItems: 'center', paddingVertical: spacing.md },
    paginationInfo: { ...typography.caption, color: colors.textMuted },
  }), [colors]);

  const renderItem = useCallback(
    ({ item }: { item: Content }) => (
      <View style={styles.gridItem}>
        <ContentCard content={item} onPress={() => handleContentPress(item)} />
      </View>
    ),
    [styles]
  );

  const keyExtractor = useCallback((item: Content) => item.id, []);

  const renderEmpty = (tab: Tab) => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{tab === 'purchased' ? '🛒' : '❤️'}</Text>
      <Text style={styles.emptyText}>
        {tab === 'purchased' ? 'No purchased books' : 'Your wishlist is empty'}
      </Text>
      <Text style={styles.emptySubtext}>
        {tab === 'purchased'
          ? 'Books you buy will appear here'
          : 'Save books to read or listen later'}
      </Text>
    </View>
  );

  const activeLoading = activeTab === 'purchased' ? purchasedLoading : wishlistState.loading;
  const activeItems = activeTab === 'purchased' ? purchasedItems : wishlistState.items;
  const onEndReached = activeTab === 'wishlist' && wishlistState.hasMore && !wishlistState.loadingMore
    ? () => fetchWishlistPage(wishlistState.page + 1, true)
    : undefined;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.tabsContainer}>
        {(['purchased', 'wishlist'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'purchased' ? 'Purchased' : 'Wishlist'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={activeItems}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          ListEmptyComponent={() => renderEmpty(activeTab)}
          ListFooterComponent={
            wishlistState.loadingMore ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
            ) : null
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
