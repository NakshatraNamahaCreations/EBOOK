import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Audio } from 'expo-av';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { contentService } from '../../src/services/content.service';
import { Content, Chapter } from '../../src/types';
import { useAudioPlayer } from '../../src/context/AudioPlayerContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COVER_SIZE = SCREEN_WIDTH - 80;

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function PlayerScreen() {
  const { id, chapterIndex } = useLocalSearchParams<{ id: string; chapterIndex?: string }>();
  const router = useRouter();
  const { soundRef, chapterIdxRef, setTrackInfo, setIsPlaying: setCtxIsPlaying } = useAudioPlayer();

  const [audiobook, setAudiobook] = useState<Content | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const [showChapters, setShowChapters] = useState(false);

  const chaptersRef = useRef<Chapter[]>([]);
  const audiobookRef = useRef<Content | null>(null);
  // Preloaded next-chapter sound + its index, so "next" feels instant
  const preloadRef = useRef<{ sound: any; index: number } | null>(null);
  // Incremented on every loadChapter call so stale async work can abort itself
  const loadGenRef = useRef(0);

  const preloadNextChapter = async (nextIndex: number) => {
    const chapters = chaptersRef.current;
    const ch = chapters[nextIndex];
    if (!ch?.audio_url) return;
    // Skip if already preloaded for this index
    if (preloadRef.current?.index === nextIndex) return;
    // Drop any previous preload
    if (preloadRef.current) {
      const old = preloadRef.current.sound;
      preloadRef.current = null;
      old?.unloadAsync?.().catch(() => {});
    }
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: ch.audio_url },
        { shouldPlay: false }
      );
      preloadRef.current = { sound, index: nextIndex };
    } catch {
      preloadRef.current = null;
    }
  };

  useEffect(() => {
    loadAudiobook();
    return () => {
      // On unmount: detach status callback so no React state updates happen
      // Do NOT unload current sound — it keeps playing via context
      if (soundRef.current) {
        soundRef.current.setOnPlaybackStatusUpdate(null);
      }
      // Drop any preloaded next chapter
      if (preloadRef.current) {
        const s = preloadRef.current.sound;
        preloadRef.current = null;
        s?.unloadAsync?.().catch(() => {});
      }
    };
  }, [id]);

  const loadAudiobook = async () => {
    try {
      const data = await contentService.getAudiobookById(id);
      setAudiobook(data);
      audiobookRef.current = data;
      chaptersRef.current = data.chapters || [];

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const requestedIndex = chapterIndex !== undefined ? parseInt(chapterIndex, 10) : 0;
      const startIndex =
        data.chapters?.[requestedIndex]?.audio_url
          ? requestedIndex
          : (data.chapters?.findIndex((ch) => ch.audio_url) ?? -1);

      if (startIndex >= 0) {
        const chapter = data.chapters[startIndex];
        // Stop previous if any
        if (soundRef.current) {
          soundRef.current.setOnPlaybackStatusUpdate(null);
          try { await soundRef.current.stopAsync(); } catch {}
          try { await soundRef.current.unloadAsync(); } catch {}
          soundRef.current = null;
        }
        setCurrentTime(0);
        setDuration(chapter.duration || 0);

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: chapter.audio_url! },
          { shouldPlay: true }
        );

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) return;
          setCurrentTime(status.positionMillis / 1000);
          if (status.durationMillis) setDuration(status.durationMillis / 1000);
          setIsPlaying(status.isPlaying);
          setCtxIsPlaying(status.isPlaying);
          if (status.didJustFinish) {
            const next = chapterIdxRef.current + 1;
            if (next < chaptersRef.current.length && chaptersRef.current[next]?.audio_url) {
              loadChapter(chaptersRef.current, next);
            }
          }
        });

        soundRef.current = newSound;
        chapterIdxRef.current = startIndex;
        setCurrentChapterIdx(startIndex);
        setCtxIsPlaying(true);

        setTrackInfo({
          bookId: id,
          bookTitle: data.title,
          chapterTitle: chapter.title,
          coverImage: chapter.chapter_image || data.cover_image,
          chapterIndex: startIndex,
        });

        // Start preloading the next chapter in the background
        preloadNextChapter(startIndex + 1);
      } else {
        setDuration(data.duration || 0);
      }
      setIsLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to load audiobook');
      setIsLoading(false);
    }
  };

  const loadChapter = async (chapters: Chapter[], index: number) => {
    const chapter = chapters[index];
    if (!chapter?.audio_url) return;

    // Generation guard — if another loadChapter starts after this one, abort here
    const myGen = ++loadGenRef.current;
    const isStale = () => loadGenRef.current !== myGen;

    // Update UI immediately so the user sees the new chapter right away
    chapterIdxRef.current = index;
    setCurrentChapterIdx(index);
    setCurrentTime(0);
    setDuration(chapter.duration || 0);
    setIsPlaying(false);
    const ab = audiobookRef.current;
    if (ab) {
      setTrackInfo({
        bookId: id,
        bookTitle: ab.title,
        chapterTitle: chapter.title,
        coverImage: chapter.chapter_image || ab.cover_image,
        chapterIndex: index,
      });
    }

    // Detach and pause old sound synchronously; unload in background
    const oldSound = soundRef.current;
    soundRef.current = null;
    if (oldSound) {
      oldSound.setOnPlaybackStatusUpdate(null);
      try { await oldSound.pauseAsync(); } catch {}
      oldSound.unloadAsync().catch(() => {});
    }

    if (isStale()) return;

    // Use preloaded sound if available, otherwise create a new one
    let newSound: any;
    if (preloadRef.current?.index === index) {
      newSound = preloadRef.current.sound;
      preloadRef.current = null;
      if (isStale()) { newSound.unloadAsync?.().catch(() => {}); return; }
      try { await newSound.playAsync(); } catch {}
    } else {
      const created = await Audio.Sound.createAsync(
        { uri: chapter.audio_url },
        { shouldPlay: false }
      );
      newSound = created.sound;
      if (isStale()) { newSound.unloadAsync?.().catch(() => {}); return; }
      try { await newSound.playAsync(); } catch {}
    }

    if (isStale()) { newSound.unloadAsync?.().catch(() => {}); return; }

    newSound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return;
      setCurrentTime(status.positionMillis / 1000);
      if (status.durationMillis) setDuration(status.durationMillis / 1000);
      setIsPlaying(status.isPlaying);
      setCtxIsPlaying(status.isPlaying);
      if (status.didJustFinish) {
        const next = chapterIdxRef.current + 1;
        if (next < chaptersRef.current.length && chaptersRef.current[next]?.audio_url) {
          loadChapter(chaptersRef.current, next);
        }
      }
    });

    soundRef.current = newSound;
    setCtxIsPlaying(true);

    // Kick off preload for the chapter after this one
    preloadNextChapter(index + 1);
  };

  const goToChapter = (index: number) => {
    const chapters = chaptersRef.current;
    if (index < 0 || index >= chapters.length) return;
    if (!chapters[index]?.audio_url) return;
    loadChapter(chapters, index);
  };

  const togglePlayback = async () => {
    if (!soundRef.current) {
      Alert.alert('Not Ready', 'No audio available for this chapter.');
      return;
    }
    if (isPlaying) {
      await soundRef.current.pauseAsync();
    } else {
      await soundRef.current.playAsync();
    }
  };

  const skip = (seconds: number) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    setCurrentTime(newTime);
    if (soundRef.current) soundRef.current.setPositionAsync(newTime * 1000);
  };

  const cycleSpeed = async () => {
    const speeds = [1.0, 1.25, 1.5, 1.75, 2.0];
    const nextIndex = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    setPlaybackSpeed(newSpeed);
    if (soundRef.current) await soundRef.current.setRateAsync(newSpeed, true);
  };

  const handleSliderChange = (value: number) => {
    setCurrentTime(value);
    if (soundRef.current) soundRef.current.setPositionAsync(value * 1000);
  };

  const currentChapter = audiobook?.chapters?.[currentChapterIdx];
  const totalChapters = audiobook?.chapters?.length ?? 0;
  const progress = duration > 0 ? currentTime / duration : 0;

  if (isLoading || !audiobook) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-down" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>NOW PLAYING</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {currentChapter ? `${currentChapter.order} of ${totalChapters}` : ''}
          </Text>
        </View>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setShowChapters(true)}>
          <Ionicons name="list" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Cover Art — chapter image if present, else book cover */}
      <View style={styles.coverWrapper}>
        <View style={styles.coverShadow}>
          <Image
            source={
              currentChapter?.chapter_image
                ? { uri: currentChapter.chapter_image }
                : audiobook.cover_image
                ? { uri: audiobook.cover_image }
                : require('../../assets/images/icon.png')
            }
            style={styles.cover}
          />
        </View>
        {/* Chapter dots */}
        <View style={styles.dots}>
          {audiobook.chapters.map((_, idx) => (
            <View key={idx} style={[styles.dot, idx === currentChapterIdx && styles.dotActive]} />
          ))}
        </View>
      </View>

      {/* Track Info */}
      <View style={styles.infoRow}>
        <View style={styles.infoText}>
          <Text style={styles.title} numberOfLines={1}>{audiobook.title}</Text>
          <Text style={styles.chapterName} numberOfLines={1}>
            {currentChapter?.title ?? audiobook.author_name}
          </Text>
        </View>
        <TouchableOpacity onPress={cycleSpeed} style={styles.speedPill}>
          <Text style={styles.speedText}>{playbackSpeed}x</Text>
        </TouchableOpacity>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <Slider
          style={styles.slider}
          value={currentTime}
          minimumValue={0}
          maximumValue={duration || 1}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.backgroundElevated}
          thumbTintColor={colors.primary}
          onValueChange={handleSliderChange}
        />
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          <Text style={styles.timeRemain}>-{formatTime(Math.max(0, duration - currentTime))}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Skip back */}
        <TouchableOpacity onPress={() => skip(-15)} style={styles.skipBtn}>
          <Ionicons name="play-back-outline" size={28} color={colors.text} />
          <Text style={styles.skipLabel}>15</Text>
        </TouchableOpacity>

        {/* Prev chapter */}
        <TouchableOpacity
          onPress={() => goToChapter(currentChapterIdx - 1)}
          style={[styles.navBtn, currentChapterIdx === 0 && styles.navBtnDisabled]}
          disabled={currentChapterIdx === 0}
          activeOpacity={0.7}
        >
          <Ionicons name="play-skip-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Play / Pause */}
        <TouchableOpacity onPress={togglePlayback} style={styles.playButton}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={36} color="#fff" />
        </TouchableOpacity>

        {/* Next chapter */}
        <TouchableOpacity
          onPress={() => goToChapter(currentChapterIdx + 1)}
          style={[styles.navBtn, currentChapterIdx >= totalChapters - 1 && styles.navBtnDisabled]}
          disabled={currentChapterIdx >= totalChapters - 1}
          activeOpacity={0.7}
        >
          <Ionicons name="play-skip-forward" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Skip forward */}
        <TouchableOpacity onPress={() => skip(15)} style={styles.skipBtn}>
          <Ionicons name="play-forward-outline" size={28} color={colors.text} />
          <Text style={styles.skipLabel}>15</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <View style={styles.progressBarThin}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.authorText}>by {audiobook.author_name}</Text>
      </View>

      {/* Chapters Modal */}
      <Modal visible={showChapters} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chapters</Text>
              <TouchableOpacity onPress={() => setShowChapters(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {audiobook.chapters.map((ch, idx) => (
                <TouchableOpacity
                  key={ch.id}
                  style={[styles.chapterRow, idx === currentChapterIdx && styles.chapterRowActive]}
                  onPress={() => {
                    if (ch.audio_url) {
                      loadChapter(audiobook.chapters, idx);
                      setShowChapters(false);
                    }
                  }}
                  disabled={!ch.audio_url}
                >
                  <View style={[styles.chapterNumBadge, idx === currentChapterIdx && styles.chapterNumBadgeActive]}>
                    <Text style={[styles.chapterRowNum, idx === currentChapterIdx && styles.chapterRowNumActive]}>
                      {ch.order}
                    </Text>
                  </View>
                  <View style={styles.chapterRowInfo}>
                    <Text style={[styles.chapterRowTitle, !ch.audio_url && styles.chapterRowDisabled]}>
                      {ch.title}
                    </Text>
                  </View>
                  {ch.audio_url ? (
                    <Ionicons
                      name={idx === currentChapterIdx ? 'volume-high' : 'play-circle-outline'}
                      size={20}
                      color={idx === currentChapterIdx ? colors.primary : colors.textMuted}
                    />
                  ) : (
                    <Ionicons name="lock-closed-outline" size={18} color={colors.textDim} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.textMuted,
  },
  headerSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Cover
  coverWrapper: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: spacing.lg,
  },
  coverShadow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 20,
    borderRadius: 20,
  },
  cover: {
    width: COVER_SIZE,
    height: COVER_SIZE,
    borderRadius: 20,
    backgroundColor: colors.backgroundCard,
  },
  dots: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 5,
    alignItems: 'center',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.backgroundElevated,
  },
  dotActive: {
    width: 20,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },

  // Info row
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  infoText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  chapterName: {
    ...typography.bodySmall,
    color: colors.primary,
  },
  speedPill: {
    backgroundColor: colors.backgroundElevated,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  speedText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },

  // Progress
  progressContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  slider: {
    width: '100%',
    height: 36,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  timeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  timeRemain: {
    fontSize: 12,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },

  // Controls
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  skipBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
  },
  skipLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  navBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  navBtnDisabled: {
    opacity: 0.35,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },

  // Bottom bar
  bottomBar: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    alignItems: 'center',
    gap: 8,
  },
  progressBarThin: {
    width: '100%',
    height: 2,
    backgroundColor: colors.backgroundElevated,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
  authorText: {
    ...typography.caption,
    color: colors.textDim,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.backgroundCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '72%',
    paddingBottom: 40,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chapterRowActive: {
    backgroundColor: 'rgba(255,107,107,0.06)',
  },
  chapterNumBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterNumBadgeActive: {
    backgroundColor: colors.primary,
  },
  chapterRowNum: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  chapterRowNumActive: {
    color: '#fff',
  },
  chapterRowInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chapterRowTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  chapterRowDisabled: {
    color: colors.textDim,
  },
});
