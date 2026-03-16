import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Platform,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { useAppDispatch } from '../../src/hooks/useAppDispatch';
import { useAppSelector } from '../../src/hooks/useAppSelector';
import { fetchHomeData } from '../../src/store/slices/contentSlice';
import { ContentCarousel } from '../../src/components/carousels/ContentCarousel';
import { LoadingScreen } from '../../src/components/layout/LoadingScreen';
import { useTheme } from '../../src/theme/ThemeContext';

const { width } = Dimensions.get('window');
const BANNER_HEIGHT = 200;
const SIDE_PADDING = spacing.md;
const ITEM_GAP = spacing.md;
const BANNER_WIDTH = width - SIDE_PADDING * 2;
const AUTO_SCROLL_INTERVAL = 3000;

export default function HomeScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const currentIndexRef = useRef(0);

  const [activeBanner, setActiveBanner] = useState(0);

  const {
    banners,
    trendingBooks,
    trendingAudiobooks,
    trendingPodcasts,
    newReleases,
    featured,
    isLoading,
  } = useAppSelector((state) => state.content);

  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!banners?.length || banners.length <= 1) return;
    const interval = setInterval(() => {
      const nextIndex =
        currentIndexRef.current === banners.length - 1 ? 0 : currentIndexRef.current + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      currentIndexRef.current = nextIndex;
      setActiveBanner(nextIndex);
    }, AUTO_SCROLL_INTERVAL);
    return () => clearInterval(interval);
  }, [banners]);

  const loadData = () => { dispatch(fetchHomeData()); };

  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (BANNER_WIDTH + ITEM_GAP));
    currentIndexRef.current = index;
    setActiveBanner(index);
  };

  const handleScrollToIndexFailed = (info: {
    index: number;
    highestMeasuredFrameIndex: number;
    averageItemLength: number;
  }) => {
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
    }, 300);
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: Platform.OS === 'ios' ? 110 : 90 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      paddingTop: spacing.xl,
    },
    greeting: { ...typography.h2, color: colors.text },
    subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 },
    coinBadge: {
      backgroundColor: colors.backgroundCard,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    coinText: { ...typography.body, color: colors.text, fontWeight: '600' as const },
    bannerListContent: { paddingHorizontal: SIDE_PADDING, paddingTop: spacing.md },
    bannerWrapper: { width: BANNER_WIDTH },
    banner: { width: '100%', height: BANNER_HEIGHT, borderRadius: 16, backgroundColor: colors.backgroundCard },
    bannerOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: spacing.md,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    bannerTitle: { ...typography.h3, color: '#fff' },
    indicatorContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: spacing.md,
      gap: 8,
    },
    indicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
    activeIndicator: { width: 22, backgroundColor: colors.primary },
    content: { paddingVertical: spacing.lg },
  }), [colors]);

  if (isLoading && banners.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadData} tintColor={colors.primary} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name || 'Reader'}!</Text>
            <Text style={styles.subtitle}>What would you like to explore today?</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/wallet')}>
            <View style={styles.coinBadge}>
              <Text style={styles.coinText}>🪙 {user?.coin_balance || 0}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {banners.length > 0 && (
          <View>
            <FlatList
              ref={flatListRef}
              data={banners}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={BANNER_WIDTH + ITEM_GAP}
              decelerationRate="fast"
              bounces={false}
              contentContainerStyle={styles.bannerListContent}
              ItemSeparatorComponent={() => <View style={{ width: ITEM_GAP }} />}
              onMomentumScrollEnd={onMomentumScrollEnd}
              onScrollToIndexFailed={handleScrollToIndexFailed}
              getItemLayout={(_, index) => ({
                length: BANNER_WIDTH + ITEM_GAP,
                offset: (BANNER_WIDTH + ITEM_GAP) * index,
                index,
              })}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => { if (item.content_id) router.push(`/book/${item.content_id}`); }}
                  style={styles.bannerWrapper}
                >
                  <Image source={{ uri: item.image }} style={styles.banner} resizeMode="cover" />
                  <View style={styles.bannerOverlay}>
                    <Text style={styles.bannerTitle}>{item.title}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
            <View style={styles.indicatorContainer}>
              {banners.map((_, index) => (
                <View
                  key={index}
                  style={[styles.indicator, index === activeBanner && styles.activeIndicator]}
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.content}>
          <ContentCarousel title="Trending Books" items={trendingBooks} />
          <ContentCarousel title="Popular Audiobooks" items={trendingAudiobooks} />
          <ContentCarousel title="New Releases" items={newReleases} />
          <ContentCarousel title="Featured" items={featured} />
          <ContentCarousel title="Trending Podcasts" items={trendingPodcasts} />
        </View>
      </ScrollView>
    </View>
  );
}
