import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import YoutubePlayer from 'react-native-youtube-iframe';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { contentService } from '../../src/services/content.service';
import { Content } from '../../src/types';
import { useAppSelector } from '../../src/hooks/useAppSelector';
import { useAppDispatch } from '../../src/hooks/useAppDispatch';
import { addToWishlist, removeFromWishlist, addToLibrary, removeFromLibrary } from '../../src/store/slices/contentSlice';
import { LoadingScreen } from '../../src/components/layout/LoadingScreen';
import { Button } from '../../src/components/buttons/Button';

const { width } = Dimensions.get('window');

function formatDuration(seconds?: number): string {
  if (!seconds) return 'N/A';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export default function PodcastDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const wishlist = useAppSelector((state) => state.content.wishlist);
  const library = useAppSelector((state) => state.content.library);
  const [podcast, setPodcast] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEpisode, setSelectedEpisode] = useState<any>(null);

  const inWishlist = wishlist.some((item) => item.id === id);
  const inLibrary = library.some((item) => item.id === id);

  useEffect(() => {
    loadPodcast();
  }, [id]);

  const loadPodcast = async () => {
    try {
      const data = await contentService.getContentById(id);
      setPodcast(data);
      if (data.chapters && data.chapters.length > 0) {
        setSelectedEpisode(data.chapters[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load podcast details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToLibrary = () => {
    if (!podcast) return;
    if (inLibrary) {
      dispatch(removeFromLibrary(podcast.id));
    } else {
      dispatch(addToLibrary(podcast));
    }
  };

  const handleWishlist = () => {
    if (!podcast) return;
    if (inWishlist) {
      dispatch(removeFromWishlist(podcast.id));
    } else {
      dispatch(addToWishlist(podcast));
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!podcast) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Podcast not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={podcast.cover_image ? { uri: podcast.cover_image } : require('../../assets/images/icon.png')}
            style={styles.cover}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.title}>{podcast.title}</Text>
            <Text style={styles.author}>by {podcast.author_name}</Text>
            <View style={styles.meta}>
              <View style={styles.rating}>
                <Ionicons name="star" size={16} color={colors.accent} />
                <Text style={styles.ratingText}>{(podcast.rating ?? 0).toFixed(1)}</Text>
                <Text style={styles.reviewsText}>({podcast.reviews_count})</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Library & Wishlist */}
        <View style={styles.actions}>
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

        {/* Video Player */}
        {selectedEpisode && selectedEpisode.youtube_id && (
          <View style={styles.playerContainer}>
            <YoutubePlayer
              height={220}
              videoId={selectedEpisode.youtube_id}
              webViewProps={{
                androidLayerType: 'hardware',
              }}
            />
            <View style={styles.nowPlaying}>
              <Text style={styles.nowPlayingText}>
                Now Playing: {selectedEpisode.title}
              </Text>
            </View>
          </View>
        )}

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{podcast.description}</Text>
        </View>

        {/* Episodes */}
        {podcast.chapters && podcast.chapters.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Episodes</Text>
            {podcast.chapters.map((episode) => (
              <View key={episode.id} style={styles.episodeItem}>
                <View style={styles.episodeInfo}>
                  <Text style={styles.episodeTitle}>{episode.title}</Text>
                  {episode.duration && (
                    <Text style={styles.episodeDuration}>
                      {formatDuration(episode.duration)}
                    </Text>
                  )}
                </View>
                <Button
                  title={selectedEpisode?.id === episode.id ? 'Playing' : 'Play'}
                  size="small"
                  variant={selectedEpisode?.id === episode.id ? 'secondary' : 'primary'}
                  onPress={() => {
                    if (episode.youtube_id) {
                      setSelectedEpisode(episode);
                    } else {
                      Alert.alert(
                        'Demo Mode',
                        'This episode would play if it had a YouTube video ID assigned.'
                      );
                    }
                  }}
                />
              </View>
            ))}\n          </View>
        )}

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>Language</Text>
            <Text style={styles.detailValue}>{podcast.language}</Text>
          </View>
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>Episodes</Text>
            <Text style={styles.detailValue}>{podcast.chapters?.length || 0}</Text>
          </View>
        </View>
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
    height: 120,
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
    marginBottom: spacing.md,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
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
  reviewsText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerContainer: {
    marginBottom: spacing.lg,
  },
  nowPlaying: {
    backgroundColor: colors.backgroundCard,
    padding: spacing.md,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  nowPlayingText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
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
  episodeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  episodeInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  episodeTitle: {
    ...typography.body,
    color: colors.text,
    marginBottom: 4,
  },
  episodeDuration: {
    ...typography.caption,
    color: colors.textSecondary,
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
