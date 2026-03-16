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
import { useAppDispatch } from '../../src/hooks/useAppDispatch';
import { useAppSelector } from '../../src/hooks/useAppSelector';
import { fetchProgress } from '../../src/store/slices/contentSlice';
import { ContentCard } from '../../src/components/cards/ContentCard';
import { contentService } from '../../src/services/content.service';
import { Content, ContentType } from '../../src/types';
import { useTheme } from '../../src/theme/ThemeContext';

type Tab = 'library' | 'wishlist' | 'inProgress';

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
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const { progress } = useAppSelector((state) => state.content);
  const { user } = useAppSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState<Tab>('library');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [libraryState, setLibraryState] = useState<PaginatedState>(emptyState());
  const [wishlistState, setWishlistState] = useState<PaginatedState>(emptyState());
  const [inProgressItems, setInProgressItems] = useState<Content[]>([]);
  const [inProgressLoading, setInProgressLoading] = useState(false);

  const fetchLibraryPage = useCallback(
    async (page: number, append = false) => {
      if (!user?.id) return;
      setLibraryState((prev) => ({
        ...prev,
        loading: page === 1 && !append,
        loadingMore: page > 1,
      }));
      try {
        const result = await contentService.getUserLibrary(user.id, page, PAGE_SIZE);
        setLibraryState((prev) => ({
          items: append ? [...prev.items, ...result.data] : result.data,
          page,
          hasMore: result.pagination ? page < result.pagination.pages : false,
          loading: false,
          loadingMore: false,
        }));
      } catch {
        setLibraryState((prev) => ({ ...prev, loading: false, loadingMore: false }));
      }
    },
    [user?.id]
  );

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

  const fetchInProgress = useCallback(async () => {
    if (!user?.id) return;
    setInProgressLoading(true);
    try {
      const libResult = await contentService.getUserLibrary(user.id, 1, 100);
      const inProgressIds = progress
        .filter((p) => !p.completed && p.total_progress > 0)
        .map((p) => p.content_id);
      setInProgressItems(libResult.data.filter((c) => inProgressIds.includes(c.id)));
    } catch {
      setInProgressItems([]);
    } finally {
      setInProgressLoading(false);
    }
  }, [user?.id, progress]);

  useEffect(() => {
    if (!user?.id) return;
    fetchLibraryPage(1);
    fetchWishlistPage(1);
    dispatch(fetchProgress(user.id));
  }, [user?.id]);

  useEffect(() => {
    if (activeTab === 'inProgress' && user?.id) {
      fetchInProgress();
    }
  }, [activeTab, progress, user?.id]);

  const handleRefresh = async () => {
    if (!user?.id) return;
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchLibraryPage(1),
        fetchWishlistPage(1),
        dispatch(fetchProgress(user.id)),
      ]);
      if (activeTab === 'inProgress') await fetchInProgress();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLoadMoreLibrary = () => {
    if (!libraryState.hasMore || libraryState.loadingMore) return;
    fetchLibraryPage(libraryState.page + 1, true);
  };

  const handleLoadMoreWishlist = () => {
    if (!wishlistState.hasMore || wishlistState.loadingMore) return;
    fetchWishlistPage(wishlistState.page + 1, true);
  };

  const handleContentPress = (content: Content) => {
    if (content.content_type === ContentType.BOOK) router.push(`/book/${content.id}`);
    else if (content.content_type === ContentType.AUDIOBOOK) router.push(`/audiobook/${content.id}`);
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
    footerLoader: { marginVertical: spacing.lg },
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
      <Text style={styles.emptyIcon}>
        {tab === 'library' ? '📚' : tab === 'wishlist' ? '❤️' : '📝'}
      </Text>
      <Text style={styles.emptyText}>
        {tab === 'library' ? 'Your library is empty' : tab === 'wishlist' ? 'Your wishlist is empty' : 'No content in progress'}
      </Text>
      <Text style={styles.emptySubtext}>
        {tab === 'library'
          ? 'Add books and audiobooks to your library'
          : tab === 'wishlist'
          ? 'Save content to read or listen later'
          : 'Start reading or listening to track progress'}
      </Text>
    </View>
  );

  const renderFooter = (state: PaginatedState) => {
    if (state.loadingMore) {
      return <ActivityIndicator color={colors.primary} style={styles.footerLoader} />;
    }
    if (!state.hasMore || state.items.length === 0) return null;
    return (
      <View style={styles.footerWrap}>
        <Text style={styles.paginationInfo}>Showing {state.items.length} items</Text>
      </View>
    );
  };

  const activeState = activeTab === 'library' ? libraryState : wishlistState;
  const activeLoading = activeTab === 'inProgress' ? inProgressLoading : activeState.loading;
  const activeItems =
    activeTab === 'library' ? libraryState.items
    : activeTab === 'wishlist' ? wishlistState.items
    : inProgressItems;
  const onEndReached =
    activeTab === 'library' ? handleLoadMoreLibrary
    : activeTab === 'wishlist' ? handleLoadMoreWishlist
    : undefined;
  const listFooter =
    activeTab === 'library' ? renderFooter(libraryState)
    : activeTab === 'wishlist' ? renderFooter(wishlistState)
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.tabsContainer}>
        {(['library', 'inProgress', 'wishlist'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'library' ? 'My Library' : tab === 'inProgress' ? 'In Progress' : 'Wishlist'}
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
          ListFooterComponent={listFooter}
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
