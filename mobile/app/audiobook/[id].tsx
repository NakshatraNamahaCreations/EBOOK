import React, { useEffect, useState } from 'react';
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
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { contentService } from '../../src/services/content.service';
import { Content, AccessType } from '../../src/types';
import { useAppSelector } from '../../src/hooks/useAppSelector';
import { useAppDispatch } from '../../src/hooks/useAppDispatch';
import { addToWishlist, removeFromWishlist, addToLibrary, removeFromLibrary } from '../../src/store/slices/contentSlice';
import { LoadingScreen } from '../../src/components/layout/LoadingScreen';
import { Button } from '../../src/components/buttons/Button';

function formatDuration(seconds?: number): string {
  if (!seconds) return 'N/A';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function calcTotalDuration(chapters: { duration?: number }[]): number {
  return chapters.reduce((sum, ch) => sum + (ch.duration || 0), 0);
}

export default function AudiobookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const wishlist = useAppSelector((state) => state.content.wishlist);
  const library = useAppSelector((state) => state.content.library);
  const [audiobook, setAudiobook] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);

  const inWishlist = wishlist.some((item) => item.id === id);
  const inLibrary = library.some((item) => item.id === id);

  useEffect(() => {
    loadAudiobook();
  }, [id]);

  const loadAudiobook = async () => {
    try {
      const data = await contentService.getAudiobookById(id);
      setAudiobook(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load audiobook details');
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = () => {
    if (!audiobook) return;

    if (audiobook.access_type === AccessType.COINS && audiobook.coin_price > (user?.coin_balance || 0)) {
      Alert.alert('Insufficient Coins', `You need ${audiobook.coin_price} coins to unlock this audiobook.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Buy Coins', onPress: () => router.push('/wallet') },
      ]);
      return;
    }

    if (audiobook.access_type === AccessType.PREMIUM && !user?.is_premium) {
      Alert.alert('Premium Required', 'This audiobook is available only for premium members.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Go Premium', onPress: () => router.push('/subscription') },
      ]);
      return;
    }

    router.push(`/player/${audiobook.id}`);
  };

  const handleAddToLibrary = () => {
    if (!audiobook) return;
    if (inLibrary) {
      dispatch(removeFromLibrary(audiobook.id));
    } else {
      dispatch(addToLibrary(audiobook));
    }
  };

  const handleWishlist = () => {
    if (!audiobook) return;
    if (inWishlist) {
      dispatch(removeFromWishlist(audiobook.id));
    } else {
      dispatch(addToWishlist(audiobook));
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!audiobook) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Audiobook not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
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
              <View style={styles.duration}>
                <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.durationText}>{formatDuration(calcTotalDuration(audiobook.chapters))}</Text>
              </View>
              <View style={styles.rating}>
                <Ionicons name="star" size={16} color={colors.accent} />
                <Text style={styles.ratingText}>{(audiobook.rating ?? 0).toFixed(1)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Button title="Play Now" onPress={handlePlay} style={styles.playButton} />
          <TouchableOpacity style={styles.iconButton} onPress={handleAddToLibrary}>
            <Ionicons
              name={inLibrary ? 'checkmark-circle' : 'add-circle-outline'}
              size={32}
              color={colors.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleWishlist}>
            <Ionicons
              name={inWishlist ? 'heart' : 'heart-outline'}
              size={32}
              color={colors.primary}
            />
          </TouchableOpacity>
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
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>{formatDuration(calcTotalDuration(audiobook.chapters))}</Text>
          </View>
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>Chapters</Text>
            <Text style={styles.detailValue}>{audiobook.chapters.length}</Text>
          </View>
        </View>

        {audiobook.chapters.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chapters</Text>
            {audiobook.chapters.map((chapter, index) => (
              <View key={chapter.id} style={styles.chapterItem}>
                <Text style={styles.chapterOrder}>{chapter.order}</Text>
                <View style={styles.chapterInfo}>
                  <Text style={styles.chapterTitle}>{chapter.title}</Text>
                  {chapter.duration && (
                    <Text style={styles.chapterDuration}>{formatDuration(chapter.duration)}</Text>
                  )}
                </View>
                {chapter.audio_url ? (
                  <TouchableOpacity
                    style={styles.chapterPlayBtn}
                    onPress={() => router.push(`/player/${audiobook.id}?chapterIndex=${index}`)}
                  >
                    <Ionicons name="play-circle" size={32} color={colors.primary} />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.chapterPlayBtn} />
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.md,
    flexDirection: 'row',
  },
  cover: {
    width: 120,
    height: 180,
    borderRadius: 12,
    backgroundColor: colors.backgroundCard,
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  author: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  narrator: {
    ...typography.bodySmall,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  duration: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    ...typography.body,
    color: colors.text,
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  playButton: {
    flex: 1,
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  detail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.body,
    color: colors.text,
  },
  chapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chapterOrder: {
    ...typography.body,
    color: colors.primary,
    fontWeight: 'bold',
    width: 40,
  },
  chapterInfo: {
    flex: 1,
  },
  chapterPlayBtn: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterTitle: {
    ...typography.body,
    color: colors.text,
    marginBottom: 2,
  },
  chapterDuration: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...typography.h3,
    color: colors.textSecondary,
  },
});
