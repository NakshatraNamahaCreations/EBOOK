import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';

const TAB_BAR_HEIGHT = 60;

export function MiniPlayer() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { trackInfo, isPlaying, togglePlayback, stop } = useAudioPlayer();

  if (!trackInfo) return null;

  const bottomOffset = TAB_BAR_HEIGHT + Math.max(insets.bottom, 0);

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      style={[s.container, {
        bottom: bottomOffset,
        backgroundColor: colors.backgroundCard,
        borderTopColor: colors.border,
        borderColor: colors.border,
      }]}
      onPress={() =>
        router.push(`/player/${trackInfo.bookId}?chapterIndex=${trackInfo.chapterIndex}`)
      }
    >
      {/* Cover */}
      <Image
        source={
          trackInfo.coverImage
            ? { uri: trackInfo.coverImage }
            : require('../../assets/images/icon.png')
        }
        style={s.cover}
      />

      {/* Info */}
      <View style={s.info}>
        <Text style={[s.title, { color: colors.text }]} numberOfLines={1}>
          {trackInfo.bookTitle}
        </Text>
        <Text style={[s.chapter, { color: colors.textSecondary }]} numberOfLines={1}>
          {trackInfo.chapterTitle}
        </Text>
      </View>

      {/* Controls */}
      <TouchableOpacity style={s.btn} onPress={togglePlayback} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={26}
          color={colors.primary}
        />
      </TouchableOpacity>

      <TouchableOpacity style={s.btn} onPress={stop} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="stop-circle" size={26} color={colors.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 8,
    right: 8,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 999,
  },
  cover: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  info: {
    flex: 1,
    marginLeft: 10,
    marginRight: 6,
  },
  title: {
    ...typography.body,
    fontWeight: '600' as const,
    fontSize: 13,
  },
  chapter: {
    ...typography.caption,
    fontSize: 11,
    marginTop: 2,
  },
  btn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});
